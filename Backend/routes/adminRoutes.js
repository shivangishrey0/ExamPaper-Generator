import express from "express";
import multer from "multer"; // <--- THIS WAS MISSING
import { getAllQuestions } from "../controllers/adminController.js";
import { publishExam, getSubmissions, gradeSubmission } from "../controllers/adminController.js";
// ... existing routes ...
import { 
    adminLogin, 
    addQuestion, 
    generatePaper, 
    getExams,
    uploadQuestions,
    getExamById 
} from "../controllers/adminController.js";

const router = express.Router();

// Configure Multer for file uploads
const upload = multer({ dest: "uploads/" });

router.post("/login", adminLogin);
router.post("/add-question", addQuestion);

// 'file' matches the name attribute in the frontend
router.post("/upload-questions", upload.single("file"), uploadQuestions);

router.post("/generate-paper", generatePaper);
router.get("/get-exams", getExams);
router.get("/exam/:id", getExamById);
router.get("/debug-questions", getAllQuestions);
router.put("/publish/:id", publishExam);
router.get("/submissions/:examId", getSubmissions);
router.post("/grade-paper", gradeSubmission);

export default router;