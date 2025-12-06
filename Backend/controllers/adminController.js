import Question from "../models/Questions.js"; 
import Exam from "../models/Exam.js";
import xlsx from "xlsx";
import fs from "fs";

// --- 1. ADMIN LOGIN ---
export const adminLogin = (req, res) => {
  const { username, password } = req.body;

  const ADMIN_USER = "admin";
  const ADMIN_PASS = "admin123";

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return res.json({ message: "Admin login success" });
  }

  return res.status(400).json({ message: "Invalid admin credentials" });
};

// --- 2. ADD QUESTION MANUALLY ---
export const addQuestion = async (req, res) => {
  try {
    console.log("Received Data:", req.body); 

    const newQuestion = new Question(req.body);
    await newQuestion.save();
    
    console.log("Saved to DB!"); 
    res.status(201).json({ message: "Question added successfully!" });
  } catch (error) {
    console.error("Error saving question:", error); 
    res.status(500).json({ message: "Error adding question", error });
  }
};

// --- 3. BULK UPLOAD QUESTIONS (EXCEL) ---
export const uploadQuestions = async (req, res) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // 1. Read the Excel File
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0]; // Take the first sheet
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // 2. Map Excel Headers to Database Schema
    // Expects headers: Question, Subject, Difficulty, OptionA, OptionB, OptionC, OptionD, CorrectAnswer
    const questionsToInsert = sheetData.map((row) => ({
      questionText: row.Question,
      subject: row.Subject,
      difficulty: row.Difficulty,
      options: [
        row.OptionA, 
        row.OptionB, 
        row.OptionC, 
        row.OptionD
      ].filter(opt => opt !== undefined), // Remove empty options if any
      correctAnswer: row.CorrectAnswer
    }));

    if (questionsToInsert.length === 0) {
      return res.status(400).json({ message: "Excel file is empty or formatted incorrectly" });
    }

    // 3. Bulk Insert into MongoDB
    await Question.insertMany(questionsToInsert);

    // 4. Cleanup: Delete the temporary file
    fs.unlinkSync(req.file.path);

    res.status(201).json({ 
      message: `Successfully uploaded ${questionsToInsert.length} questions!` 
    });

  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ message: "Failed to upload questions", error: error.message });
  }
};

// --- 4. GENERATE PAPER (The Algorithm) ---
export const generatePaper = async (req, res) => {
  const { title, subject, easyCount, mediumCount, hardCount } = req.body;

  // --- ADD THIS CHECK ---
  if (!title || title.trim() === "") {
    return res.status(400).json({ message: "Please provide an Exam Title." });
  }

  try {
    // MongoDB Aggregation to pick RANDOM questions
    const easyQ = await Question.aggregate([
      { $match: { subject, difficulty: "Easy" } },
      { $sample: { size: Number(easyCount) } }
    ]);

    const mediumQ = await Question.aggregate([
      { $match: { subject, difficulty: "Medium" } },
      { $sample: { size: Number(mediumCount) } }
    ]);

    const hardQ = await Question.aggregate([
      { $match: { subject, difficulty: "Hard" } },
      { $sample: { size: Number(hardCount) } }
    ]);

    const allQuestions = [...easyQ, ...mediumQ, ...hardQ];

    if (allQuestions.length === 0) {
      return res.status(400).json({ message: "Not enough questions in database for this criteria." });
    }

    const newExam = new Exam({
      title,
      subject,
      questions: allQuestions.map(q => q._id)
    });

    await newExam.save();

    res.status(201).json({ 
      message: "Exam generated successfully!", 
      exam: newExam,
      totalQuestions: allQuestions.length 
    });

  } catch (error) {
    console.error("Generate Error:", error);
    res.status(500).json({ message: "Error generating exam" });
  }
};

// --- 5. GET ALL EXAMS ---
export const getExams = async (req, res) => {
    try {
        // .populate("questions") is the magic part!
        // It fills in the actual question data instead of just the ID.
        const exams = await Exam.find()
            .populate("questions") 
            .sort({ createdAt: -1 });
            
        res.json(exams);
    } catch (error) {
        res.status(500).json({ message: "Error fetching exams" });
    }
};
// --- 6. GET SINGLE EXAM BY ID (New) ---
export const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate("questions");
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: "Error loading exam" });
  }
};