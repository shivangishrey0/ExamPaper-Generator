import express from "express";
import { 
  getAvailableExams, 
  getExamById, 
  submitExam 
} from "../controllers/authController.js"; // Importing from authController where you put the logic

const router = express.Router();

// Matches: /api/user/exams
router.get("/exams", getAvailableExams);

// Matches: /api/user/exam/:id
router.get("/exam/:id", getExamById);

// Matches: /api/user/submit-exam
router.post("/submit-exam", submitExam);

export default router;