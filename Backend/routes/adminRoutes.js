import express from "express";
import multer from "multer"; // <--- THIS WAS MISSING
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

export default router;