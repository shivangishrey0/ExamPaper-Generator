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
      // Don't fail registration if email fails, but log it
    }
    
    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("Register Error:", err);
    
    // Handle MongoDB duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    
    // Handle validation errors
    if (err.name === "ValidationError") {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: errors.join(", ") });
    }
    
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// --- VERIFY ---
export const verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    
    // Check if user exists and OTP matches
    if (!user) return res.status(400).json({ message: "User not found" });
    if (user.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });
    
    // Optional: Check if OTP is expired (if you have expiry logic in DB)
    if (user.otpExpiry && user.otpExpiry < Date.now()) {
        return res.status(400).json({ message: "OTP has expired" });
    }

    user.isVerified = true; 
    user.otp = undefined; // Clear OTP after use
    user.otpExpiry = undefined;
    await user.save();
    
    res.json({ message: "Email Verified Successfully" });
  } catch(err) { 
      console.error(err);
      res.status(500).json({message: "Server Error"}); 
  }
};

// --- LOGIN ---
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    if (!user.isVerified) {
        return res.status(400).json({ message: "Email not verified" });
    }

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
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// --- FORGOT PASSWORD (FIXED) ---
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("Forgot Password requested for:", email);

    // 1. Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: "User with this email does not exist" });
    }

    // 2. Generate New OTP
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = otpExpiry(); // Set expiry (e.g., 10 mins from now)
    await user.save();

    // 3. Send Email
    await sendMail(email, "Reset Password Request", `
      <h3>Password Reset</h3>
      <p>You requested to reset your password.</p>
      <p>Your OTP is: <b style="font-size: 20px;">${otp}</b></p>
      <p>This OTP is valid for 10 minutes.</p>
    `);

    res.json({ message: "OTP sent to your email" });

  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Error sending email" });
  }
};

// --- RESET PASSWORD (FIXED) ---
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // 1. Find User
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // 2. Verify OTP
    if (user.otp !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
    }

    // 3. Check Expiry
    if (user.otpExpiry && user.otpExpiry < Date.now()) {
        return res.status(400).json({ message: "OTP Expired. Please request a new one." });
    }

    // 4. Hash New Password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // 5. Update User
    user.password = hashedPassword;
    user.otp = undefined;       // Clear OTP
    user.otpExpiry = undefined; // Clear Expiry
    await user.save();

    res.json({ message: "Password reset successful. You can now login." });

  } catch (error) {
    console.error("Reset Password Error:", error);
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
    console.error("Error fetching exams:", error);
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