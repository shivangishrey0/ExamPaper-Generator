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

  deleteExam,
  deleteAllQuestions // <--- ADDED THIS IMPORT
} from "../controllers/adminController.js";

const router = express.Router();

// Configure Multer for File Uploads
const upload = multer({ dest: "uploads/" });

// --- AUTH ---
router.post("/login", adminLogin);

// --- QUESTION MANAGEMENT ---
router.post("/add-question", addQuestion);
router.post("/upload-questions", upload.single("file"), uploadQuestions);

router.delete("/delete-all-questions", deleteAllQuestions); // <--- ADDED THIS ROUTE

// --- EXAM MANAGEMENT ---
router.post("/generate-paper", generatePaper);
router.get("/get-exams", getExams);
router.get("/exam/:id", getExamById);
router.delete("/exam/:id", deleteExam);

// --- PUBLISH & GRADING ---
router.put("/publish/:id", publishExam);
router.get("/submissions/:examId", getSubmissions);
router.post("/grade-paper", gradeSubmission);

export default router;