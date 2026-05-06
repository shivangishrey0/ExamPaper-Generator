import express from "express";
import multer from "multer";
import {
  addQuestion,
  generatePaper,
  getExams,
  uploadQuestions,
  getExamById,
  publishExam,
  getSubmissions,
  gradeSubmission,
  deleteExam,
  deleteAllQuestions
} from "../controllers/adminController.js";
import { verifyToken, requireRole, requirePermission } from "../middleware/rbac.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.use(verifyToken, requireRole("teacher", "superadmin"));

router.post("/add-question", requirePermission("create_exam"), addQuestion);
router.post("/upload-questions", requirePermission("create_exam"), upload.single("file"), uploadQuestions);
router.delete("/delete-all-questions", requireRole("superadmin"), deleteAllQuestions);

router.post("/generate-paper", requirePermission("create_exam"), generatePaper);
router.get("/exams", getExams);
router.get("/exam/:id", getExamById);
router.delete("/exam/:id", requirePermission("create_exam"), deleteExam);

router.put("/publish/:id", requirePermission("publish_exam"), publishExam);
router.get("/submissions/:examId", requirePermission("view_submissions"), getSubmissions);
router.post("/grade-paper", requirePermission("grade"), gradeSubmission);

export default router;
