import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateOTP, otpExpiry } from "../utils/otp.js";
import { sendMail } from "../utils/mailer.js";
import Exam from "../models/Exam.js";
import Submission from "../models/submission.js";

// --- REGISTER ---
export const registerStart = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !username.trim()) {
      return res.status(400).json({ message: "Username is required" });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Check if email already exists
    const exists = await User.findOne({ email: email.trim().toLowerCase() });
    if (exists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    
    // Save user with OTP
    const user = new User({ 
        username: username.trim(), 
        email: email.trim().toLowerCase(), 
        password: hashedPassword, 
        otp, 
        otpExpiry: otpExpiry() 
    });
    
    await user.save();
    
    // Send Email
    try {
      await sendMail(email.trim().toLowerCase(), "Verify Your Account", `<p>Your verification OTP is: <b>${otp}</b></p>`);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
    }
    
    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("Register Error:", err);
    if (err.code === 11000) return res.status(400).json({ message: "Email already exists" });
    if (err.name === "ValidationError") return res.status(400).json({ message: Object.values(err.errors).map(e => e.message).join(", ") });
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// --- VERIFY ---
export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) return res.status(400).json({ message: "User not found" });
    if (user.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });
    if (user.otpExpiry && user.otpExpiry < Date.now()) return res.status(400).json({ message: "OTP has expired" });

    user.isVerified = true; 
    user.otp = undefined; 
    user.otpExpiry = undefined;
    await user.save();
    
    res.json({ message: "Email Verified Successfully" });
  } catch(err) { 
      res.status(500).json({message: "Server Error"}); 
  }
};

// --- LOGIN ---
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });
    if (!user.isVerified) return res.status(400).json({ message: "Email not verified" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Incorrect password" });

    const secret = process.env.JWT_SECRET || "fallback_secret";
    const token = jwt.sign({ id: user._id }, secret, { expiresIn: "7d" });

    return res.status(200).json({ 
      message: "Login successful",
      result: user, 
      token,
      userId: user._id, 
      username: user.username 
    });
  } catch (error) {
    return res.status(500).json({ message: "Server Error" });
  }
};

// --- FORGOT PASSWORD ---
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User with this email does not exist" });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = otpExpiry(); 
    await user.save();

    await sendMail(email, "Reset Password Request", `
      <h3>Password Reset</h3>
      <p>Your OTP is: <b style="font-size: 20px;">${otp}</b></p>
      <p>This OTP is valid for 10 minutes.</p>
    `);
    res.json({ message: "OTP sent to your email" });
  } catch (error) {
    res.status(500).json({ message: "Error sending email" });
  }
};

// --- RESET PASSWORD ---
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });
    if (user.otpExpiry && user.otpExpiry < Date.now()) return res.status(400).json({ message: "OTP Expired" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = undefined; 
    user.otpExpiry = undefined;
    await user.save();

    res.json({ message: "Password reset successful. You can now login." });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// --- GET EXAMS ---
export const getAvailableExams = async (req, res) => {
  try {
    const { studentId } = req.query; 
    const exams = await Exam.find({ isPublished: true }).sort({ createdAt: -1 });

    if (!studentId) {
        const cleanExams = exams.map(e => ({ ...e.toObject(), status: "not_attempted" }));
        return res.json(cleanExams);
    }

    const examsWithStatus = await Promise.all(exams.map(async (exam) => {
      try {
        const submission = await Submission.findOne({ examId: exam._id, studentId });
        let status = "not_attempted";
        let score = null;

        if (submission) {
          // Status depends on isGraded flag
          status = submission.isGraded ? "graded" : "submitted";
          score = submission.score;
        }
        return { ...exam.toObject(), status, score };
      } catch (err) {
        return { ...exam.toObject(), status: "not_attempted" };
      }
    }));

    res.json(examsWithStatus);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching exams" });
  }
};

// --- GET SINGLE EXAM ---
export const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate("questions");
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: "Error loading exam" });
  }
};

// --- HELPER: NORMALIZE TEXT ---
const normalizeAnswer = (text) => {
  if (!text) return "";
  return String(text).trim().toLowerCase().replace(/\s+/g, " "); 
};

// --- SUBMIT EXAM ---
export const submitExam = async (req, res) => {
  const { examId, answers, studentId } = req.body; 
  
  try {
    const exam = await Exam.findById(examId).populate("questions");
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    
    // Check double submission
    const existingSubmission = await Submission.findOne({ examId, studentId });
    if (existingSubmission) return res.status(400).json({ message: "Already submitted." });

    let calculatedScore = 0;
    console.log("--- INITIAL AUTO-GRADING START ---"); 

    exam.questions.forEach((question) => {
      const qId = question._id.toString();
      let studentAns = answers[qId]; 

      // 🔥 Option Key Correction Logic
      if (studentAns && typeof studentAns === 'string' && studentAns.toLowerCase().startsWith("option")) {
         const cleanKey = studentAns.toLowerCase().replace("option", "").trim(); 
         let index = -1;
         if (cleanKey === "a" || cleanKey === "1") index = 0;
         else if (cleanKey === "b" || cleanKey === "2") index = 1;
         else if (cleanKey === "c" || cleanKey === "3") index = 2;
         else if (cleanKey === "d" || cleanKey === "4") index = 3;

         if (index !== -1 && question.options && question.options[index]) {
             studentAns = question.options[index];
         }
      }

      if (question.correctAnswer) {
        const cleanStudent = normalizeAnswer(studentAns);
        const cleanCorrect = normalizeAnswer(question.correctAnswer);

        if (cleanStudent === cleanCorrect) {
          calculatedScore += 1; 
        }
      }
    });

    // --- IMPORTANT CHANGE HERE ---
    // We force isGraded: false regardless of exam type.
    // This ensures the status stays "submitted" (Pending) until Admin clicks Publish.
    
    const newSubmission = new Submission({ 
      examId, 
      studentId, 
      answers, 
      score: calculatedScore, // Saves the tentative score
      isGraded: false // <--- ALWAYS FALSE Initially
    });

    await newSubmission.save();
    
    res.json({ 
      message: "Exam submitted successfully! Waiting for admin review.", 
      score: calculatedScore,
      total: exam.questions.length
    });

  } catch (error) {
    console.error("Submit Error:", error);
    res.status(500).json({ message: "Error submitting exam" });
  }
};