import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateOTP, otpExpiry } from "../utils/otp.js";
import { sendMail } from "../utils/mailer.js";
import Exam from "../models/Exam.js";
import Submission from "../models/Submission.js";

// --- REGISTER ---
export const registerStart = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const user = new User({ username, email, password: hashedPassword, otp, otpExpiry: otpExpiry() });
    await user.save();
    await sendMail(email, "Your OTP", `<p>OTP: ${otp}</p>`);
    res.json({ message: "OTP sent" });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// --- VERIFY ---
export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });
    user.isVerified = true; user.otp = undefined;
    await user.save();
    res.json({ message: "Verified" });
  } catch(err) { res.status(500).json({message: "Server Error"}); }
};

// --- LOGIN (DEBUG VERSION) ---
export const login = async (req, res) => {
  console.log("🔥 1. Login Request Received for:", req.body.email);

  try {
    const { email, password } = req.body;

    // Step 1: Database Check
    console.log("🔥 2. Searching Database...");
    const user = await User.findOne({ email });
    
    if (!user) {
        console.log("❌ User Not Found in DB");
        return res.status(400).json({ message: "User not found" });
    }
    console.log("✅ User Found:", user.username);

    // Step 2: Verify Check
    if (!user.isVerified) {
        console.log("❌ User Not Verified");
        return res.status(400).json({ message: "Email not verified" });
    }

    // Step 3: Password Check
    console.log("🔥 3. Checking Password...");
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        console.log("❌ Password Wrong");
        return res.status(400).json({ message: "Incorrect password" });
    }
    console.log("✅ Password Correct");

    // Step 4: Token Generation
    console.log("🔥 4. Generating Token...");
    const secret = process.env.JWT_SECRET || "fallback_secret";
    const token = jwt.sign({ id: user._id }, secret, { expiresIn: "7d" });

    // Step 5: Send Response
    console.log("🔥 5. Sending Success Response...");
    return res.status(200).json({ 
      message: "Login successful",
      result: user, 
      token,
      userId: user._id, 
      username: user.username 
    });

  } catch (error) {
    // THIS IS WHAT WE NEED TO SEE
    console.error("☠️ CRITICAL SERVER CRASH:", error);
    return res.status(500).json({ message: "Server Error: " + error.message });
  }
};

// --- FORGOT PASSWORD ---
export const forgotPassword = async (req, res) => {
    // Keep your existing logic or placeholders
    res.json({ message: "Forgot Password endpoint" });
};

// --- RESET PASSWORD ---
export const resetPassword = async (req, res) => {
    res.json({ message: "Reset Password endpoint" });
};

// --- GET EXAMS ---
// --- SMART GET EXAMS (Checks if student attempted) ---
export const getAvailableExams = async (req, res) => {
  try {
    const { studentId } = req.query; 

    // 1. Get ONLY Published Exams
    const exams = await Exam.find({ isPublished: true }).sort({ createdAt: -1 });

    // 2. If no student ID, return list with default status
    if (!studentId) {
        const cleanExams = exams.map(e => ({ ...e.toObject(), status: "not_attempted" }));
        return res.json(cleanExams);
    }

    // 3. Check Submissions safely
    const examsWithStatus = await Promise.all(exams.map(async (exam) => {
      try {
        const submission = await Submission.findOne({ examId: exam._id, studentId });
        
        let status = "not_attempted";
        let score = null;

        if (submission) {
          status = submission.isGraded ? "graded" : "submitted";
          score = submission.score;
        }

        // ✅ FIXED LINE BELOW (Removed the underscore)
        return { ...exam.toObject(), status, score };
        
      } catch (err) {
        console.error(`Error checking submission for exam ${exam._id}:`, err);
        return { ...exam.toObject(), status: "not_attempted" };
      }
    }));

    res.json(examsWithStatus);

  } catch (error) {
    console.error("❌ Critical Error in getAvailableExams:", error);
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

// --- SUBMIT EXAM ---
export const submitExam = async (req, res) => {
  const { examId, answers, studentId } = req.body; 
  try {
    const exam = await Exam.findById(examId);
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    const existingSubmission = await Submission.findOne({ examId, studentId });
    if (existingSubmission) return res.status(400).json({ message: "Already submitted." });

    const newSubmission = new Submission({ examId, studentId, answers, isGraded: false });
    await newSubmission.save();
    res.json({ message: "Exam submitted successfully!" });
  } catch (error) {
    console.error("Submit Error:", error);
    res.status(500).json({ message: "Error submitting exam" });
  }
};