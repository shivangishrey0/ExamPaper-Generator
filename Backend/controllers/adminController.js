import Question from "../models/Questions.js";
import Exam from "../models/Exam.js";
import xlsx from "xlsx";
import fs from "fs";
import Submission from "../models/submission.js";
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
    const { questionText, subject, difficulty, correctAnswer } = req.body;

    if (!questionText?.trim() || !subject || !difficulty) {
      return res.status(400).json({ message: "Missing required fields (Question, Subject, or Difficulty)" });
    }

    const newQuestion = new Question(req.body);
    await newQuestion.save();

    res.status(201).json({ message: "Question added successfully!", question: newQuestion });
  } catch (error) {
    console.error("Add Question Error:", error);
    res.status(500).json({ message: "Error adding question: " + error.message });
  }
};

// --- 3. BULK UPLOAD QUESTIONS ---
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
      // 1. Identify Type
      let rawType = getValue(row, ["QuestionType", "Type", "qType"]) || "mcq";
      rawType = rawType.toLowerCase().trim();

      let finalType = "mcq";
      if (rawType.includes("long") || rawType.includes("essay")) finalType = "long";
      else if (rawType.includes("short") || rawType.includes("subjective") || rawType.includes("theory")) finalType = "short";

      // 2. Extract Options
      const options = [];
      let optA = getValue(row, ["OptionA", "Option1", "A"]);
      let optB = getValue(row, ["OptionB", "Option2", "B"]);
      let optC = getValue(row, ["OptionC", "Option3", "C"]);
      let optD = getValue(row, ["OptionD", "Option4", "D"]);

      if (finalType === "mcq") {
        if (optA) options.push(String(optA).trim());
        if (optB) options.push(String(optB).trim());
        if (optC) options.push(String(optC).trim());
        if (optD) options.push(String(optD).trim());
      }

      // 3. Handle Correct Answer
      let correctRaw = getValue(row, ["CorrectAnswer", "Correct Answer", "Answer", "Correct"]);
      let finalAnswer = correctRaw ? String(correctRaw).trim() : "Refer to evaluation criteria";

      if (finalType === "mcq" && options.length > 0) {
        const upper = finalAnswer.toUpperCase();
        let index = -1;

        if (upper === "A" || upper === "1" || upper === "OPTION A") index = 0;
        else if (upper === "B" || upper === "2" || upper === "OPTION B") index = 1;
        else if (upper === "C" || upper === "3" || upper === "OPTION C") index = 2;
        else if (upper === "D" || upper === "4" || upper === "OPTION D") index = 3;

        if (index >= 0 && index < options.length) {
          finalAnswer = options[index];
        }
      }

      return {
        questionText: getValue(row, ["Question", "QuestionText", "QText"]),
        subject: getValue(row, ["Subject", "Sub"]),
        difficulty: getValue(row, ["Difficulty", "Diff"]) || "Medium",
        section: getValue(row, ["Section", "Sec"]) || "Section A",
        questionType: finalType,
        options: options,
        correctAnswer: finalAnswer
      };
    });

    const validQuestions = questionsToInsert.filter(q => q.questionText && q.subject);

    if (validQuestions.length === 0) {
      return res.status(400).json({ message: "No valid questions found in Excel." });
    }

    await Question.insertMany(validQuestions);
    fs.unlinkSync(req.file.path);

    res.status(201).json({
      message: `Successfully uploaded ${validQuestions.length} questions!`,
      typeDetected: validQuestions[0].questionType
    });

  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: "Failed to upload", error: error.message });
  }
};

// Helper: Shuffle
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Helper: Select Random
const selectRandomQuestions = (excelQuestions, count) => {
  const shuffled = shuffleArray(excelQuestions);
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

// --- 4. MASTER EXAM GENERATOR ---
// --- 4. MASTER EXAM GENERATOR (UPDATED WITH DURATION) ---
export const generatePaper = async (req, res) => {
  console.log("🚀 STARTING EXAM GENERATION...");

  // 1. Destructure 'duration' from the request body
  const { title, subject, paperType, duration, easyCount, mediumCount, hardCount, mcqCount, shortCount, longCount } = req.body;

  if (!title || !subject) return res.status(400).json({ message: "Please provide Exam Title and Subject." });

  const cleanSubject = subject.trim();
  const subjectRegex = new RegExp(`^${cleanSubject}$`, "i");
  let questions = [];

  try {
    if (paperType === "mcq_only") {
      const easyExcel = await Question.find({ subject: subjectRegex, questionType: /^mcq$/i, difficulty: /^(easy|simple)$/i });
      const mediumExcel = await Question.find({ subject: subjectRegex, questionType: /^mcq$/i, difficulty: /^(medium|avg)$/i });
      const hardExcel = await Question.find({ subject: subjectRegex, questionType: /^mcq$/i, difficulty: /^(hard|difficult)$/i });

      questions = [
        ...selectRandomQuestions(easyExcel, Number(easyCount) || 0),
        ...selectRandomQuestions(mediumExcel, Number(mediumCount) || 0),
        ...selectRandomQuestions(hardExcel, Number(hardCount) || 0)
      ];
    }
    else if (paperType === "subjective_only") {
      const shortsExcel = await Question.find({ subject: subjectRegex, questionType: /^short$/i });
      const longsExcel = await Question.find({ subject: subjectRegex, questionType: /^long$/i });

      questions = [
        ...selectRandomQuestions(shortsExcel, Number(shortCount) || 0),
        ...selectRandomQuestions(longsExcel, Number(longCount) || 0)
      ];
    }
    else if (paperType === "mixed") {
      const mcqsExcel = await Question.find({ subject: subjectRegex, questionType: /^mcq$/i });
      const shortsExcel = await Question.find({ subject: subjectRegex, questionType: /^short$/i });
      const longsExcel = await Question.find({ subject: subjectRegex, questionType: /^long$/i });

      questions = [
        ...selectRandomQuestions(mcqsExcel, Number(mcqCount) || 0),
        ...selectRandomQuestions(shortsExcel, Number(shortCount) || 0),
        ...selectRandomQuestions(longsExcel, Number(longCount) || 0)
      ];
    }

    if (questions.length === 0) return res.status(400).json({ message: "No questions found matching criteria." });

    // 2. Save the Exam with Duration
    const newExam = new Exam({
      title,
      subject: cleanSubject,
      questions: questions.map(q => q._id),
      isPublished: false,
      duration: Number(duration) || 0 // Saves duration (or 0 if empty)
    });

    await newExam.save();
    res.status(201).json({ message: `Exam '${title}' created!`, exam: newExam, totalQuestions: questions.length });

  } catch (error) {
    console.error("GENERATOR ERROR:", error);
    res.status(500).json({ message: "Server error during generation." });
  }
};

// --- 5. GET EXAMS ---
export const getExams = async (req, res) => {
  try {
    const exams = await Exam.find().populate("questions").sort({ createdAt: -1 });
    res.json(exams);
  } catch (error) { res.status(500).json({ message: "Error fetching exams" }); }
};

// --- 6. GET SINGLE EXAM ---
export const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate("questions");
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    res.json(exam);
  } catch (error) { res.status(500).json({ message: "Error loading exam" }); }
};

// --- 7. PUBLISH EXAM ---
export const publishExam = async (req, res) => {
  try {
    const updatedExam = await Exam.findByIdAndUpdate(req.params.id, { isPublished: true }, { new: true });
    res.json({ message: "Exam is LIVE!", exam: updatedExam });
  } catch (error) { res.status(500).json({ message: "Error publishing exam" }); }
};

// --- 8. SUBMISSIONS & GRADING ---

export const getSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ examId: req.params.examId }).populate("studentId", "username email").populate("examId", "title");
    res.json(submissions);
  } catch (error) { res.status(500).json({ message: "Error fetching submissions" }); }
};

// HELPER: Normalize strings for comparison
const cleanStr = (str) => String(str || "").trim().toLowerCase();

export const gradeSubmission = async (req, res) => {
  try {
    const { submissionId, score: frontendScore } = req.body;

    // 1. Fetch the submission
    const submission = await Submission.findById(submissionId);
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    // 2. Fetch the exam to get the correct answers
    const exam = await Exam.findById(submission.examId).populate("questions");
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    console.log("--- SERVER SIDE GRADING START ---");
    let serverCalculatedScore = 0;

    // 3. Iterate and Calculate Score Server-Side
    exam.questions.forEach((q) => {
      if (q.questionType === 'mcq') {
        const qId = q._id.toString();

        // --- FIXED: Use Bracket Notation for Object Access ---
        const studentAns = submission.answers[qId] || "";

        const correctAns = q.correctAnswer;

        // Strict comparison logging
        const isMatch = cleanStr(studentAns) === cleanStr(correctAns);

        if (isMatch) {
          serverCalculatedScore += 1;
          console.log(`Q: ${q.questionText.substring(0, 15)}... | Student: "${studentAns}" | Correct: "${correctAns}" [MATCH]`);
        } else {
          console.log(`Q: ${q.questionText.substring(0, 15)}... | Student: "${studentAns}" | Correct: "${correctAns}" [NO MATCH]`);
        }
      }
    });

    // 4. Handle Manual Scores vs Server Score
    const finalScore = frontendScore !== undefined ? frontendScore : serverCalculatedScore;

    console.log(`--- GRADING END. Final Score: ${finalScore} ---`);

    // 5. Update Database
    await Submission.findByIdAndUpdate(submissionId, {
      score: finalScore,
      isGraded: true
    });

    res.json({ message: "Result published!", score: finalScore });

  } catch (error) {
    console.error("Grading Error:", error);
    res.status(500).json({ message: "Error grading paper" });
  }
};

// --- 9. AI GENERATOR (PLACEHOLDER) ---
export const generateQuestionsAI = async (req, res) => {
  res.json({ message: "AI Generator is currently disabled per user request." });
};

// --- 10. DELETE EXAM (SAFE MODE) ---
export const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Not found" });

    // NOTE: We do NOT delete questions here anymore. 
    console.log(`Deleting Exam ${exam.title} (${req.params.id}) - QUESTIONS PRESERVED`);

    await Submission.deleteMany({ examId: req.params.id });
    await Exam.findByIdAndDelete(req.params.id);

    res.json({ message: "Exam deleted successfully (Questions preserved in Bank)" });
  } catch (error) {
    console.error("Delete Exam Error:", error);
    res.status(500).json({ message: "Error deleting" });
  }
};

// --- 11. DELETE ALL QUESTIONS ---
export const deleteAllQuestions = async (req, res) => {
  try {
    await Question.deleteMany({});
    res.json({ message: "All questions deleted from database!" });
  } catch (error) {
    res.status(500).json({ message: "Error clearing database" });
  }
};