import Question from "../models/Questions.js";
import Exam from "../models/Exam.js";
import xlsx from "xlsx";
import fs from "fs";
import Submission from "../models/submission.js";
import dotenv from "dotenv";
 
dotenv.config();
 
const getRequestUserId = (req) => req.user?.userId || req.user?.id;
 
const canAccessExam = (req, exam) => {
  if (!exam) return false;
  if (req.user?.role === "superadmin") return true;
  return exam.createdBy?.toString() === String(getRequestUserId(req));
};
 
export const addQuestion = async (req, res) => {
  try {
    const { questionText, subject, difficulty } = req.body;
    if (!questionText?.trim() || !subject || !difficulty)
      return res.status(400).json({ message: "Missing required fields" });
    const newQuestion = new Question(req.body);
    await newQuestion.save();
    res.status(201).json({ message: "Question added successfully!", question: newQuestion });
  } catch (error) {
    res.status(500).json({ message: "Error adding question: " + error.message });
  }
};
 
export const uploadQuestions = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
 
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
 
    const getValue = (row, potentialHeaders) => {
      const rowKeys = Object.keys(row);
      const foundKey = rowKeys.find(key =>
        potentialHeaders.some(ph => key.toLowerCase().trim() === ph.toLowerCase().trim())
      );
      return foundKey ? row[foundKey] : undefined;
    };
 
    const questionsToInsert = sheetData.map((row) => {
      let rawType = getValue(row, ["QuestionType", "Type", "qType"]) || "mcq";
      rawType = rawType.toLowerCase().trim();
 
      let finalType = "mcq";
      if (rawType.includes("long") || rawType.includes("essay")) finalType = "long";
      else if (rawType.includes("short") || rawType.includes("subjective")) finalType = "short";
 
      const options = [];
      if (finalType === "mcq") {
        ["OptionA","Option1","A"].forEach(h => { const v = getValue(row, [h]); if (v) options.push(String(v).trim()); });
        // fallback for B C D
        const optB = getValue(row, ["OptionB","Option2","B"]);
        const optC = getValue(row, ["OptionC","Option3","C"]);
        const optD = getValue(row, ["OptionD","Option4","D"]);
        if (optB) options.push(String(optB).trim());
        if (optC) options.push(String(optC).trim());
        if (optD) options.push(String(optD).trim());
      }
 
      let correctRaw = getValue(row, ["CorrectAnswer","Correct Answer","Answer","Correct"]);
      let finalAnswer = correctRaw ? String(correctRaw).trim() : "Refer to evaluation criteria";
 
      if (finalType === "mcq" && options.length > 0) {
        const upper = finalAnswer.toUpperCase();
        let index = -1;
        if (upper === "A" || upper === "1") index = 0;
        else if (upper === "B" || upper === "2") index = 1;
        else if (upper === "C" || upper === "3") index = 2;
        else if (upper === "D" || upper === "4") index = 3;
        if (index >= 0 && index < options.length) finalAnswer = options[index];
      }
 
      return {
        questionText: getValue(row, ["Question","QuestionText","QText"]),
        subject: getValue(row, ["Subject","Sub"]),
        difficulty: getValue(row, ["Difficulty","Diff"]) || "Medium",
        section: getValue(row, ["Section","Sec"]) || "Section A",
        questionType: finalType,
        options,
        correctAnswer: finalAnswer,
      };
    });
 
    const validQuestions = questionsToInsert.filter(q => q.questionText && q.subject);
    if (validQuestions.length === 0)
      return res.status(400).json({ message: "No valid questions found in Excel." });
 
    await Question.insertMany(validQuestions);
    fs.unlinkSync(req.file.path);
    res.status(201).json({ message: `Successfully uploaded ${validQuestions.length} questions!` });
  } catch (error) {
    res.status(500).json({ message: "Failed to upload", error: error.message });
  }
};
 
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
 
const selectRandomQuestions = (list, count) =>
  shuffleArray(list).slice(0, Math.min(count, list.length));
 
export const generatePaper = async (req, res) => {
  const { title, subject, paperType, duration, easyCount, mediumCount, hardCount, mcqCount, shortCount, longCount } = req.body;
  if (!title || !subject)
    return res.status(400).json({ message: "Please provide Exam Title and Subject." });
 
  const subjectRegex = new RegExp(`^${subject.trim()}$`, "i");
  let questions = [];
 
  try {
    if (paperType === "mcq_only") {
      const easy = await Question.find({ subject: subjectRegex, questionType: /^mcq$/i, difficulty: /^(easy|simple)$/i });
      const medium = await Question.find({ subject: subjectRegex, questionType: /^mcq$/i, difficulty: /^(medium|avg)$/i });
      const hard = await Question.find({ subject: subjectRegex, questionType: /^mcq$/i, difficulty: /^(hard|difficult)$/i });
      questions = [
        ...selectRandomQuestions(easy, Number(easyCount) || 0),
        ...selectRandomQuestions(medium, Number(mediumCount) || 0),
        ...selectRandomQuestions(hard, Number(hardCount) || 0),
      ];
    } else if (paperType === "subjective_only") {
      const shorts = await Question.find({ subject: subjectRegex, questionType: /^short$/i });
      const longs = await Question.find({ subject: subjectRegex, questionType: /^long$/i });
      questions = [
        ...selectRandomQuestions(shorts, Number(shortCount) || 0),
        ...selectRandomQuestions(longs, Number(longCount) || 0),
      ];
    } else if (paperType === "mixed") {
      const mcqs = await Question.find({ subject: subjectRegex, questionType: /^mcq$/i });
      const shorts = await Question.find({ subject: subjectRegex, questionType: /^short$/i });
      const longs = await Question.find({ subject: subjectRegex, questionType: /^long$/i });
      questions = [
        ...selectRandomQuestions(mcqs, Number(mcqCount) || 0),
        ...selectRandomQuestions(shorts, Number(shortCount) || 0),
        ...selectRandomQuestions(longs, Number(longCount) || 0),
      ];
    }
 
    if (questions.length === 0)
      return res.status(400).json({ message: "No questions found matching criteria." });
 
    const newExam = new Exam({
      title,
      subject: subject.trim(),
      createdBy: getRequestUserId(req),
      questions: questions.map(q => q._id),
      isPublished: false,
      duration: Number(duration) || 0,
    });
 
    await newExam.save();
    res.status(201).json({ message: `Exam '${title}' created!`, exam: newExam, totalQuestions: questions.length });
  } catch (error) {
    res.status(500).json({ message: "Server error during generation.", error: error.message });
  }
};
 
// --- PAGINATED GET EXAMS ---
// GET /api/teacher/exams?page=1&limit=6&search=dbms
export const getExams = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 6);
    const skip = (page - 1) * limit;
 
    // Superadmin sees all, teacher sees only their own
    const baseFilter = req.user?.role === "superadmin"
      ? {}
      : { createdBy: getRequestUserId(req) };
 
    // Optional search by title
    if (req.query.search && req.query.search.trim()) {
      baseFilter.title = new RegExp(req.query.search.trim(), "i");
    }
 
    const [exams, total] = await Promise.all([
      Exam.find(baseFilter)
        .populate("questions")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Exam.countDocuments(baseFilter),
    ]);
 
    return res.json({
      exams,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching exams" });
  }
};
 
export const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate("questions");
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    if (!canAccessExam(req, exam))
      return res.status(403).json({ message: "Forbidden: exam access denied" });
    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: "Error loading exam" });
  }
};
 
export const publishExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    if (!canAccessExam(req, exam))
      return res.status(403).json({ message: "Forbidden" });
    const updated = await Exam.findByIdAndUpdate(req.params.id, { isPublished: true }, { new: true });
    res.json({ message: "Exam is LIVE!", exam: updated });
  } catch (error) {
    res.status(500).json({ message: "Error publishing exam" });
  }
};
 
export const getSubmissions = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    if (!canAccessExam(req, exam))
      return res.status(403).json({ message: "Forbidden" });
    const submissions = await Submission.find({ examId: req.params.examId })
      .populate("studentId", "username email")
      .populate("examId", "title");
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching submissions" });
  }
};
 
const cleanStr = (str) => String(str || "").trim().toLowerCase();
 
export const gradeSubmission = async (req, res) => {
  try {
    const { submissionId, score: frontendScore } = req.body;
    const submission = await Submission.findById(submissionId);
    if (!submission) return res.status(404).json({ message: "Submission not found" });
 
    const exam = await Exam.findById(submission.examId).populate("questions");
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    if (!canAccessExam(req, exam))
      return res.status(403).json({ message: "Forbidden" });
 
    let serverScore = 0;
    exam.questions.forEach((q) => {
      if (q.questionType === "mcq") {
        const studentAns = submission.answers[q._id.toString()] || "";
        if (cleanStr(studentAns) === cleanStr(q.correctAnswer)) serverScore++;
      }
    });
 
    const finalScore = frontendScore !== undefined ? frontendScore : serverScore;
    await Submission.findByIdAndUpdate(submissionId, { score: finalScore, isGraded: true });
    res.json({ message: "Result published!", score: finalScore });
  } catch (error) {
    res.status(500).json({ message: "Error grading paper" });
  }
};
 
export const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Not found" });
    if (!canAccessExam(req, exam))
      return res.status(403).json({ message: "Forbidden" });
    await Submission.deleteMany({ examId: req.params.id });
    await Exam.findByIdAndDelete(req.params.id);
    res.json({ message: "Exam deleted (questions preserved)" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting" });
  }
};
 
export const deleteAllQuestions = async (req, res) => {
  try {
    await Question.deleteMany({});
    res.json({ message: "All questions deleted!" });
  } catch (error) {
    res.status(500).json({ message: "Error clearing database" });
  }
};
 
export const generateQuestionsAI = async (req, res) => {
  res.json({ message: "AI Generator is currently disabled." });
};
 
// Keep for backward compat
export const adminLogin = (req, res) => {
  res.status(410).json({ message: "This endpoint is deprecated. Use /api/auth/login" });
};