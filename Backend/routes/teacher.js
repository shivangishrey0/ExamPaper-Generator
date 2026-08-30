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

const ALLOWED_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls
]);

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const isAllowedExt = /\.(xlsx|xls)$/i.test(file.originalname);
    if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !isAllowedExt) {
      return cb(new Error("Only .xlsx or .xls files are allowed"));
    }
    cb(null, true);
  },
});

const handleUpload = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message || "Upload failed" });
    next();
  });
};

router.use(verifyToken, requireRole("teacher", "superadmin"));

router.post("/add-question", requirePermission("create_exam"), addQuestion);
router.post("/upload-questions", requirePermission("create_exam"), handleUpload, uploadQuestions);
router.delete("/delete-all-questions", requireRole("superadmin"), deleteAllQuestions);

router.post("/generate-paper", requirePermission("create_exam"), generatePaper);
router.get("/exams", getExams);
router.get("/exam/:id", getExamById);
router.delete("/exam/:id", requirePermission("create_exam"), deleteExam);

router.put("/publish/:id", requirePermission("publish_exam"), publishExam);
router.get("/submissions/:examId", requirePermission("view_submissions"), getSubmissions);
router.post("/grade-paper", requirePermission("grade"), gradeSubmission);

export default router;
