// ✅ FIXED IMPORT: Now points to "Questions.js" (Plural)
import Question from "../models/Questions.js"; 

import Exam from "../models/Exam.js";
import xlsx from "xlsx";
import fs from "fs";
import Submission from "../models/Submission.js";
import { GoogleGenerativeAI } from "@google/generative-ai"; 

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

// --- 3. BULK UPLOAD QUESTIONS (EXCEL) ---
// --- 3. BULK UPLOAD QUESTIONS (SMART VERSION) ---
export const uploadQuestions = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Helper to find value from fuzzy headers (e.g., finds "Correct Answer" or "correctanswer")
    const getValue = (row, potentialHeaders) => {
      const rowKeys = Object.keys(row);
      const foundKey = rowKeys.find(key => 
        potentialHeaders.some(ph => key.toLowerCase().trim() === ph.toLowerCase().trim())
      );
      return foundKey ? row[foundKey] : undefined;
    };

    const questionsToInsert = sheetData.map((row, index) => {
      // 1. Get Question Type
      let qType = getValue(row, ["QuestionType", "Type", "qType", "uestionType"]) || "mcq";
      qType = qType.toLowerCase().trim();

      // 2. Get Options (Only if MCQ)
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

      // 3. Get Correct Answer (Crucial Step!)
      // We look for: CorrectAnswer, Correct Answer, Answer, Correct, rrectAnswer
      let correct = getValue(row, ["CorrectAnswer", "Correct Answer", "Answer", "Correct", "rrectAnswer"]);
      
      return {
        questionText: getValue(row, ["Question", "QuestionText", "QText", "uestion"]),
        subject: getValue(row, ["Subject", "Sub"]),
        difficulty: getValue(row, ["Difficulty", "Diff"]) || "Medium",
        section: getValue(row, ["Section", "Sec"]) || "Section A",
        questionType: qType,
        options: options,
        correctAnswer: correct ? String(correct) : undefined // Convert to string safely
      };
    });

    // 4. Validate Data (Check for missing fields)
    const validQuestions = questionsToInsert.filter(q => 
        q.questionText && q.subject && q.correctAnswer
    );

    if (validQuestions.length === 0) {
      // DEBUG: Log why it failed for the first row
      console.log("Validation Failed. First Row Parsed:", questionsToInsert[0]);
      return res.status(400).json({ message: "No valid questions found. Check Excel Headers (Question, Subject, CorrectAnswer)." });
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

// --- 4. GENERATE PAPER ---
// --- 4. GENERATE PAPER (MIXED: MCQ + SUBJECTIVE) ---
// --- 4. MASTER EXAM GENERATOR ---
// --- 4. MASTER EXAM GENERATOR (FLEXIBLE FIX) ---
export const generatePaper = async (req, res) => {
  const { title, subject, paperType, easyCount, mediumCount, hardCount, mcqCount, shortCount, longCount } = req.body;

  // 1. Basic Validation
  if (!title || !subject) {
    return res.status(400).json({ message: "Please provide Exam Title and Subject." });
  }

  // CLEAN INPUTS (Remove spaces)
  const cleanSubject = subject.trim();
  
  // REGEX GENERATORS (Make searches case-insensitive)
  // This matches "DBMS", "dbms", "Dbms " -> All work!
  const subjectRegex = new RegExp(`^${cleanSubject}$`, "i"); 
  
  // Difficulty Regexes
  const easyRegex = /^(easy|simple)$/i;       // Matches "Easy", "easy"
  const mediumRegex = /^(medium|avg)$/i;      // Matches "Medium", "medium"
  const hardRegex = /^(hard|difficult)$/i;    // Matches "Hard", "hard"
  
  // Type Regexes
  const mcqRegex = /^mcq$/i;
  const shortRegex = /^short$/i;
  const longRegex = /^long$/i;

  let questions = [];

  try {
    // --- MODE A: MCQ ONLY (Based on Difficulty) ---
    if (paperType === "mcq_only") {
      const easy = await Question.aggregate([
        { $match: { subject: subjectRegex, questionType: mcqRegex, difficulty: easyRegex } },
        { $sample: { size: Number(easyCount) || 0 } }
      ]);
      const medium = await Question.aggregate([
        { $match: { subject: subjectRegex, questionType: mcqRegex, difficulty: mediumRegex } },
        { $sample: { size: Number(mediumCount) || 0 } }
      ]);
      const hard = await Question.aggregate([
        { $match: { subject: subjectRegex, questionType: mcqRegex, difficulty: hardRegex } },
        { $sample: { size: Number(hardCount) || 0 } }
      ]);
      questions = [...easy, ...medium, ...hard];
    }

    // --- MODE B: SUBJECTIVE ONLY (Based on Length) ---
    else if (paperType === "subjective_only") {
      const shorts = await Question.aggregate([
        { $match: { subject: subjectRegex, questionType: shortRegex } },
        { $sample: { size: Number(shortCount) || 0 } }
      ]);
      const longs = await Question.aggregate([
        { $match: { subject: subjectRegex, questionType: longRegex } },
        { $sample: { size: Number(longCount) || 0 } }
      ]);
      questions = [...shorts, ...longs];
    }

    // --- MODE C: MIXED (Standard Pattern) ---
    else if (paperType === "mixed") {
      const mcqs = await Question.aggregate([
        { $match: { subject: subjectRegex, questionType: mcqRegex } },
        { $sample: { size: Number(mcqCount) || 0 } }
      ]);
      const shorts = await Question.aggregate([
        { $match: { subject: subjectRegex, questionType: shortRegex } },
        { $sample: { size: Number(shortCount) || 0 } }
      ]);
      const longs = await Question.aggregate([
        { $match: { subject: subjectRegex, questionType: longRegex } },
        { $sample: { size: Number(longCount) || 0 } }
      ]);
      questions = [...mcqs, ...shorts, ...longs];
    }

    // --- FINAL CHECK ---
    if (questions.length === 0) {
      // DEBUGGING HELP:
      console.log(`Failed to find questions for Subject: "${cleanSubject}"`);
      return res.status(400).json({ message: "No questions found. Check if the Subject spelling matches your Excel sheet exactly." });
    }

    // Create the Exam
    const newExam = new Exam({
      title,
      subject: cleanSubject,
      questions: questions.map(q => q._id),
      isPublished: false 
    });

    await newExam.save();

    res.status(201).json({ 
      message: `Exam '${title}' created with ${questions.length} questions!`, 
      exam: newExam,
      totalQuestions: questions.length
    });

  } catch (error) {
    console.error("Generator Error:", error);
    res.status(500).json({ message: "Server error during generation." });
  }
};
// Helper Function
async function createExamInDB(title, subject, questions) {
    const newExam = new Exam({
        title,
        subject,
        questions: questions.map(q => q._id)
    });
    await newExam.save();
    return newExam;
}
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