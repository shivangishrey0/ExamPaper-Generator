import express from "express";
import multer from "multer";
import { 
  adminLogin, 
  addQuestion, 
  generatePaper, 
  getExams,
  uploadQuestions,
  getExamById,
  publishExam,      // <--- MAKE SURE THIS IS IMPORTED
  getSubmissions,   // <--- AND THIS
  gradeSubmission   // <--- AND THIS
} from "../controllers/adminController.js";

const router = express.Router();

// Configure Multer
const upload = multer({ dest: "uploads/" });

// --- AUTH ---
router.post("/login", adminLogin);

// --- QUESTIONS ---
router.post("/add-question", addQuestion);
router.post("/upload-questions", upload.single("file"), uploadQuestions);

// --- EXAM MANAGEMENT ---
router.post("/generate-paper", generatePaper);
router.get("/get-exams", getExams);
router.get("/exam/:id", getExamById);

// --- PUBLISH & GRADING (THIS WAS LIKELY MISSING) ---
router.put("/publish/:id", publishExam);  // <--- CRITICAL LINE
router.get("/submissions/:examId", getSubmissions);
router.post("/grade-paper", gradeSubmission);

export default router;