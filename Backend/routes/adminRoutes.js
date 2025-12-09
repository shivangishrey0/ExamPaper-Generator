import express from "express";
import multer from "multer";
import { 
  adminLogin, 
  addQuestion, 
  generatePaper, 
  getExams, 
  uploadQuestions, 
  getExamById, 
  publishExam, 
  getSubmissions, 
  gradeSubmission,
  generateQuestionsAI,
  deleteExam,
  deleteAllQuestions 
} from "../controllers/adminController.js";

const router = express.Router();

// Configure Multer for File Uploads
const upload = multer({ dest: "uploads/" });

// --- AUTH ---
router.post("/login", adminLogin);

// --- QUESTION MANAGEMENT ---
router.post("/add-question", addQuestion); // Manual Add
router.post("/upload-questions", upload.single("file"), uploadQuestions); // Bulk Upload
router.post("/generate-ai-questions", generateQuestionsAI); // ✨ AI Generator
router.delete("/delete-all-questions", deleteAllQuestions); // ⚠️ Clear Entire Database

// --- EXAM MANAGEMENT ---
router.post("/generate-paper", generatePaper); // Create Exam Logic
router.get("/get-exams", getExams); // List all exams
router.get("/exam/:id", getExamById); // View single exam
router.delete("/exam/:id", deleteExam); // 🗑️ Delete Exam & its questions

// --- PUBLISH & GRADING ---
router.put("/publish/:id", publishExam); // Make Live
router.get("/submissions/:examId", getSubmissions); // View Student Results
router.post("/grade-paper", gradeSubmission); // Assign Score

export default router;