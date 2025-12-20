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
    console.log("Add Question Request Body:", req.body);

    // Validation
    const { questionText, subject, difficulty, correctAnswer } = req.body;

    if (!questionText || !questionText.trim()) {
      return res.status(400).json({ message: "Question text is required" });
    }
    if (!subject) {
      return res.status(400).json({ message: "Subject is required" });
    }
    if (!difficulty) {
      return res.status(400).json({ message: "Difficulty is required" });
    }
    if (!correctAnswer || !correctAnswer.trim()) {
      return res.status(400).json({ message: "Correct answer is required" });
    }

    const newQuestion = new Question(req.body);
    await newQuestion.save();

    console.log("Question added successfully:", newQuestion._id);
    res.status(201).json({ message: "Question added successfully!", question: newQuestion });
  } catch (error) {
    console.error("Add Question Error:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ message: errors.join(", ") });
    }

    res.status(500).json({ message: "Error adding question: " + error.message });
  }
};

// --- 3. BULK UPLOAD QUESTIONS (FIXED LOGIC) ---
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

      // --- FIX: Normalize Type for Subjective/Mixed ---
      let finalType = "mcq";
      if (rawType.includes("mcq") || rawType.includes("objective")) {
        finalType = "mcq";
      } else if (rawType.includes("long") || rawType.includes("essay")) {
        finalType = "long";
      } else if (rawType.includes("short") || rawType.includes("subjective") || rawType.includes("theory")) {
        finalType = "short"; // Converts 'Subjective' -> 'short'
      }

      const options = [];
      if (finalType === "mcq") {
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
        questionType: finalType,
        options: options,
        correctAnswer: correct ? String(correct) : "Refer to evaluation criteria"
      };
    });

    // Accept subjective questions even when CorrectAnswer is blank.
    const validQuestions = questionsToInsert.filter(q => {
      const hasBasics = q.questionText && q.subject;
      if (!hasBasics) return false;

      if (q.questionType === "mcq") {
        // MCQ needs a correct answer
        return Boolean(q.correctAnswer);
      }
      // Subjective (short/long) allowed without correctAnswer
      return true;
    });

    if (validQuestions.length === 0) {
      return res.status(400).json({ message: "No valid questions found." });
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

// Helper function to shuffle array randomly
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Helper function to randomly select questions from both sources
const selectRandomQuestions = (excelQuestions, aiQuestions, count) => {
  const allQuestions = [...excelQuestions, ...aiQuestions];
  const shuffled = shuffleArray(allQuestions);
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

// --- 4. MASTER EXAM GENERATOR ---
export const generatePaper = async (req, res) => {
  console.log("🚀 STARTING EXAM GENERATION...");
  const { title, subject, paperType, easyCount, mediumCount, hardCount, mcqCount, shortCount, longCount } = req.body;

  if (!title || !subject) return res.status(400).json({ message: "Please provide Exam Title and Subject." });

  const cleanSubject = subject.trim();
  const subjectRegex = new RegExp(`^${cleanSubject}$`, "i");
  let questions = [];

  try {
    if (paperType === "mcq_only") {
      // Fetch from both Excel and AI sources
      const easyExcel = await Question.find({ subject: subjectRegex, questionType: /^mcq$/i, difficulty: /^(easy|simple)$/i });
      const easy = selectRandomQuestions(easyExcel, [], Number(easyCount) || 0);

      const mediumExcel = await Question.find({ subject: subjectRegex, questionType: /^mcq$/i, difficulty: /^(medium|avg)$/i });
      const medium = selectRandomQuestions(mediumExcel, [], Number(mediumCount) || 0);

      const hardExcel = await Question.find({ subject: subjectRegex, questionType: /^mcq$/i, difficulty: /^(hard|difficult)$/i });
      const hard = selectRandomQuestions(hardExcel, [], Number(hardCount) || 0);

      questions = [...easy, ...medium, ...hard];
    }
    else if (paperType === "subjective_only") {
      const shortsExcel = await Question.find({ subject: subjectRegex, questionType: /^short$/i });
      const shorts = selectRandomQuestions(shortsExcel, [], Number(shortCount) || 0);

      const longsExcel = await Question.find({ subject: subjectRegex, questionType: /^long$/i });
      const longs = selectRandomQuestions(longsExcel, [], Number(longCount) || 0);

      questions = [...shorts, ...longs];
    }
    else if (paperType === "mixed") {
      const mcqsExcel = await Question.find({ subject: subjectRegex, questionType: /^mcq$/i });
      const mcqs = selectRandomQuestions(mcqsExcel, [], Number(mcqCount) || 0);

      const shortsExcel = await Question.find({ subject: subjectRegex, questionType: /^short$/i });
      const shorts = selectRandomQuestions(shortsExcel, [], Number(shortCount) || 0);

      const longsExcel = await Question.find({ subject: subjectRegex, questionType: /^long$/i });
      const longs = selectRandomQuestions(longsExcel, [], Number(longCount) || 0);

      questions = [...mcqs, ...shorts, ...longs];
    }

    if (questions.length === 0) return res.status(400).json({ message: "No questions found matching criteria." });

    const newExam = new Exam({
      title,
      subject: cleanSubject,
      questions: questions.map(q => q._id),
      isPublished: false
    });

    await newExam.save();
    res.status(201).json({ message: `Exam '${title}' created!`, exam: newExam, totalQuestions: questions.length });

  } catch (error) {
    console.error("🔥 GENERATOR ERROR:", error);
    res.status(500).json({ message: "Server error during generation." });
  }
};

// Helper function to populate questions from both models
const populateQuestionsFromBothSources = async (questionIds) => {
  if (!questionIds || questionIds.length === 0) return [];

  // Fetch from both models
  const excelQuestions = await Question.find({ _id: { $in: questionIds } });


  // Create a map for quick lookup
  const questionMap = new Map();

  // Add Excel questions
  excelQuestions.forEach(q => {
    questionMap.set(q._id.toString(), { ...q.toObject(), source: "excel" });
  });

  // Add AI questions (will overwrite if same ID exists, but shouldn't happen)


  // Return questions in the same order as questionIds
  return questionIds
    .map(id => questionMap.get(id.toString()))
    .filter(q => q !== undefined);
};

// --- 5. GET EXAMS ---
export const getExams = async (req, res) => {
  try {
    const exams = await Exam.find().sort({ createdAt: -1 });

    // Populate questions from both sources for each exam
    const examsWithQuestions = await Promise.all(
      exams.map(async (exam) => {
        const questions = await populateQuestionsFromBothSources(exam.questions);
        return {
          ...exam.toObject(),
          questions: questions
        };
      })
    );

    res.json(examsWithQuestions);
  } catch (error) {
    console.error("Get Exams Error:", error);
    res.status(500).json({ message: "Error fetching exams" });
  }
};

// --- 6. GET SINGLE EXAM ---
export const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    // Populate questions from both sources
    const questions = await populateQuestionsFromBothSources(exam.questions);

    res.json({
      ...exam.toObject(),
      questions: questions
    });
  } catch (error) {
    console.error("Get Exam By ID Error:", error);
    res.status(500).json({ message: "Error loading exam" });
  }
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

export const gradeSubmission = async (req, res) => {
  try {
    await Submission.findByIdAndUpdate(req.body.submissionId, { score: req.body.score, isGraded: true });
    res.json({ message: "Result published!" });
  } catch (error) { res.status(500).json({ message: "Error grading paper" }); }
};

// --- 9. AI GENERATOR ---


// --- 10. DELETE EXAM ---
export const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ message: "Not found" });

    // Delete questions from both models if they exist
    if (exam.questions?.length > 0) {
      await Question.deleteMany({ _id: { $in: exam.questions } });

    }

    await Submission.deleteMany({ examId: req.params.id });
    await Exam.findByIdAndDelete(req.params.id);
    res.json({ message: "Exam deleted" });
  } catch (error) {
    console.error("Delete Exam Error:", error);
    res.status(500).json({ message: "Error deleting" });
  }
};

// --- 11. DELETE ALL QUESTIONS (THE NEW FEATURE) ---
export const deleteAllQuestions = async (req, res) => {
  try {
    await Question.deleteMany({});
    res.json({ message: "All questions deleted!" });
  } catch (error) {
    res.status(500).json({ message: "Error clearing database" });
  }
};