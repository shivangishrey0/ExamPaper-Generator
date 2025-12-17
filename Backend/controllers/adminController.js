import Question from "../models/Questions.js"; 
import Exam from "../models/Exam.js";
import xlsx from "xlsx";
import fs from "fs";
import Submission from "../models/Submission.js";
import { GoogleGenerativeAI } from "@google/generative-ai"; 
import dotenv from "dotenv";

dotenv.config();

// --- 1. ADMIN LOGIN ---
export const adminLogin = (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "admin123") {
    return res.json({ message: "Admin login success" });
  }
  return res.status(400).json({ message: "Invalid admin credentials" });
};

// --- 2. ADD QUESTION MANUALLY ---
export const addQuestion = async (req, res) => {
  try {
    const newQuestion = new Question(req.body);
    await newQuestion.save();
    res.status(201).json({ message: "Question added successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Error adding question", error });
  }
};

// --- 3. BULK UPLOAD QUESTIONS (SMART VERSION) ---
export const uploadQuestions = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Helper to find value from fuzzy headers
    const getValue = (row, potentialHeaders) => {
      const rowKeys = Object.keys(row);
      const foundKey = rowKeys.find(key => 
        potentialHeaders.some(ph => key.toLowerCase().trim() === ph.toLowerCase().trim())
      );
      return foundKey ? row[foundKey] : undefined;
    };

    const questionsToInsert = sheetData.map((row, index) => {
      let qType = getValue(row, ["QuestionType", "Type", "qType"]) || "mcq";
      qType = qType.toLowerCase().trim();

      const options = [];
      if (qType === "mcq") {
        const optA = getValue(row, ["OptionA", "Option1", "A"]);
        const optB = getValue(row, ["OptionB", "Option2", "B"]);
        const optC = getValue(row, ["OptionC", "Option3", "C"]);
        const optD = getValue(row, ["OptionD", "Option4", "D"]);
        if (optA) options.push(String(optA));
        if (optB) options.push(String(optB));
        if (optC) options.push(String(optC));
        if (optD) options.push(String(optD));
      }

      let correct = getValue(row, ["CorrectAnswer", "Correct Answer", "Answer", "Correct"]);
      
      return {
        questionText: getValue(row, ["Question", "QuestionText", "QText"]),
        subject: getValue(row, ["Subject", "Sub"]),
        difficulty: getValue(row, ["Difficulty", "Diff"]) || "Medium",
        section: getValue(row, ["Section", "Sec"]) || "Section A",
        questionType: qType,
        options: options,
        correctAnswer: correct ? String(correct) : undefined
      };
    });

    const validQuestions = questionsToInsert.filter(q => 
        q.questionText && q.subject && q.correctAnswer
    );

    if (validQuestions.length === 0) {
      console.log("Validation Failed. First Row Parsed:", questionsToInsert[0]);
      return res.status(400).json({ message: "No valid questions found. Check Excel Headers." });
    }

    await Question.insertMany(validQuestions);
    fs.unlinkSync(req.file.path);

    res.status(201).json({ 
      message: `Successfully uploaded ${validQuestions.length} questions!` 
    });

  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: "Failed to upload", error: error.message });
  }
};

// --- 4. MASTER EXAM GENERATOR (FLEXIBLE FIX) ---
// --- DEBUG VERSION OF GENERATE PAPER ---
export const generatePaper = async (req, res) => {
  console.log("-----------------------------------------");
  console.log("🚀 STARTING EXAM GENERATION...");
  console.log("📥 Received Data:", req.body);

  const { title, subject, paperType, easyCount, mediumCount, hardCount, mcqCount, shortCount, longCount } = req.body;

  // 1. Check Title & Subject
  if (!title || !subject) {
    console.log("❌ Error: Missing Title or Subject");
    return res.status(400).json({ message: "Please provide Exam Title and Subject." });
  }

  const cleanSubject = subject.trim();
  const subjectRegex = new RegExp(`^${cleanSubject}$`, "i"); 
  
  console.log(`🔎 Searching for Subject: "${cleanSubject}" (Regex: ${subjectRegex})`);
  console.log(`📄 Paper Type: ${paperType}`);

  let questions = [];

  try {
    // MODE A: MCQ ONLY
    if (paperType === "mcq_only") {
      console.log(`🔢 Requesting MCQs -> Easy: ${easyCount}, Medium: ${mediumCount}, Hard: ${hardCount}`);
      
      const easy = await Question.find({ subject: subjectRegex, questionType: /^mcq$/i, difficulty: /^(easy|simple)$/i }).limit(Number(easyCount) || 0);
      const medium = await Question.find({ subject: subjectRegex, questionType: /^mcq$/i, difficulty: /^(medium|avg)$/i }).limit(Number(mediumCount) || 0);
      const hard = await Question.find({ subject: subjectRegex, questionType: /^mcq$/i, difficulty: /^(hard|difficult)$/i }).limit(Number(hardCount) || 0);
      
      console.log(`✅ Found -> Easy: ${easy.length}, Medium: ${medium.length}, Hard: ${hard.length}`);
      questions = [...easy, ...medium, ...hard];
    }

    // MODE B: SUBJECTIVE ONLY
    else if (paperType === "subjective_only") {
      console.log(`Requesting Subjective -> Short: ${shortCount}, Long: ${longCount}`);
      const shorts = await Question.find({ subject: subjectRegex, questionType: /^short$/i }).limit(Number(shortCount) || 0);
      const longs = await Question.find({ subject: subjectRegex, questionType: /^long$/i }).limit(Number(longCount) || 0);
      console.log(`✅ Found -> Short: ${shorts.length}, Long: ${longs.length}`);
      questions = [...shorts, ...longs];
    }

    // MODE C: MIXED
    else if (paperType === "mixed") {
      console.log(`Requesting Mixed -> MCQs: ${mcqCount}, Short: ${shortCount}, Long: ${longCount}`);
      const mcqs = await Question.find({ subject: subjectRegex, questionType: /^mcq$/i }).limit(Number(mcqCount) || 0);
      const shorts = await Question.find({ subject: subjectRegex, questionType: /^short$/i }).limit(Number(shortCount) || 0);
      const longs = await Question.find({ subject: subjectRegex, questionType: /^long$/i }).limit(Number(longCount) || 0);
      console.log(`✅ Found -> MCQs: ${mcqs.length}, Short: ${shorts.length}, Long: ${longs.length}`);
      questions = [...mcqs, ...shorts, ...longs];
    }

    console.log(`🏁 Total Questions Collected: ${questions.length}`);

    if (questions.length === 0) {
      console.log("❌ Error: No questions matched the criteria.");
      return res.status(400).json({ message: "No questions found matching criteria. Check Server Logs." });
    }

    const newExam = new Exam({
      title,
      subject: cleanSubject,
      questions: questions.map(q => q._id),
      isPublished: false 
    });

    await newExam.save();
    console.log("🎉 SUCCESS! Exam Saved.");

    res.status(201).json({ 
      message: `Exam '${title}' created with ${questions.length} questions!`, 
      exam: newExam,
      totalQuestions: questions.length
    });

  } catch (error) {
    console.error("🔥 CRITICAL GENERATOR ERROR:", error);
    res.status(500).json({ message: "Server error during generation." });
  }
};

// --- 5. GET EXAMS ---
export const getExams = async (req, res) => {
    try {
        const exams = await Exam.find().populate("questions").sort({ createdAt: -1 });
        res.json(exams);
    } catch (error) {
        res.status(500).json({ message: "Error fetching exams" });
    }
};

// --- 6. GET SINGLE EXAM ---
export const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate("questions");
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: "Error loading exam" });
  }
};

// --- 7. PUBLISH EXAM ---
export const publishExam = async (req, res) => {
  try {
    const updatedExam = await Exam.findByIdAndUpdate(req.params.id, { isPublished: true }, { new: true });
    res.json({ message: "Exam is LIVE!", exam: updatedExam });
  } catch (error) {
    res.status(500).json({ message: "Error publishing exam" });
  }
};

// --- 8. SUBMISSIONS & GRADING ---
export const getSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ examId: req.params.examId }).populate("studentId", "username email").populate("examId", "title");
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching submissions" });
  }
};

export const gradeSubmission = async (req, res) => {
  try {
    await Submission.findByIdAndUpdate(req.body.submissionId, { score: req.body.score, isGraded: true });
    res.json({ message: "Result published!" });
  } catch (error) {
    res.status(500).json({ message: "Error grading paper" });
  }
};

// --- 9. AI GENERATOR ---
export const generateQuestionsAI = async (req, res) => {
  const { topic, subject, count, difficulty } = req.body;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  try {
    const prompt = `Generate ${count} multiple-choice questions on "${topic}" (Subject: ${subject}) Difficulty: ${difficulty}. Output strictly JSON array: [{ "questionText": "...", "options": ["A","B","C","D"], "correctAnswer": "A", "subject": "${subject}", "difficulty": "${difficulty}" }]`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    
    const savedQuestions = await Question.insertMany(JSON.parse(text));
    res.json({ message: `AI created ${savedQuestions.length} questions!`, questions: savedQuestions });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ message: "AI generation failed." });
  }
};

// --- 10. DELETE EXAM ---
export const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Not found" });

    if (exam.questions?.length > 0) await Question.deleteMany({ _id: { $in: exam.questions } });
    await Submission.deleteMany({ examId: req.params.id });
    await Exam.findByIdAndDelete(req.params.id);

    res.json({ message: "Exam deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting" });
  }
};

// --- 11. DELETE ALL QUESTIONS ---
export const deleteAllQuestions = async (req, res) => {
  try {
    await Question.deleteMany({});
    res.json({ message: "All questions deleted!" });
  } catch (error) {
    res.status(500).json({ message: "Error clearing database" });
  }
};