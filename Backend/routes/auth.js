import express from "express";
import {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resetPassword,
  getAvailableExams,
  getExamById,
  submitExam,
} from "../controllers/authController.js";
import { setPassword } from "../controllers/superAdminController.js";
import { verifyToken } from "../middleware/rbac.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/verify-otp", verifyEmail);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/set-password", setPassword);

// Protected student routes
router.get("/exams", verifyToken, getAvailableExams);
router.get("/exam/:id", verifyToken, getExamById);
router.post("/submit-exam", verifyToken, submitExam);

export default router;