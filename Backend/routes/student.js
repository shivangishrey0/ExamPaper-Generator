import express from "express";
import {
  getAvailableExams,
  getExamById,
  submitExam
} from "../controllers/authController.js";
import { verifyToken, requireRole, requirePermission } from "../middleware/rbac.js";

const router = express.Router();

router.use(verifyToken, requireRole("student"), requirePermission("take_exam"));

router.get("/exams", getAvailableExams);
router.get("/exam/:id", getExamById);
router.post("/submit-exam", submitExam);

export default router;
