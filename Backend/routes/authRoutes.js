import express from "express";
import { 
  registerStart, 
  verifyEmail, 
  login, 
  forgotPassword, 
  resetPassword,
  // IMPORT THE NEW FUNCTIONS HERE:
  getAvailableExams,
  getExamById,
  submitExam
} from "../controllers/authController.js";

const router = express.Router();

// --- Auth Routes ---
router.post("/register-start", registerStart);
router.post("/verify-email", verifyEmail);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// --- Student Exam Routes (Now connected to authController) ---
router.get("/user/exams", getAvailableExams);       // Matches frontend fetch("/api/user/exams")
router.get("/user/exam/:id", getExamById);          // Matches frontend fetch("/api/user/exam/:id")
router.post("/user/submit-exam", submitExam);       // Matches frontend submit

export default router;