import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateOTP, otpExpiry } from "../utils/otp.js";
import { sendMail } from "../utils/mailer.js";
import Exam from "../models/Exam.js";
import Submission from "../models/submission.js";
import { getPermissionsForRole } from "../utils/permissions.js";

const getRequestUserId = (req) => req.user?.userId || req.user?.id;

const buildAuthResponse = (user, token) => {
  const permissions = getPermissionsForRole(user.role);
  return {
    message: "Login successful",
    token,
    userId: user._id,
    name: user.username,
    role: user.role,
    permissions
  };
};

// --- REGISTER ---
export const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const normalizedRole = String(role || "student").toLowerCase();

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
    if (!["teacher", "student"].includes(normalizedRole)) {
      return res.status(400).json({ message: "Role must be teacher or student" });
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
      role: normalizedRole,
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

// Backward compatibility with existing route naming.
export const registerStart = register;

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
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// --- LOGIN ---
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || "").trim().toLowerCase() });
    if (!user) return res.status(400).json({ message: "User not found" });
    if (!user.isActive) return res.status(403).json({ message: "Account is deactivated" });
    if (!user.isVerified) return res.status(400).json({ message: "Email not verified" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Incorrect password" });

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "JWT secret is not configured" });
    }

    const permissions = getPermissionsForRole(user.role);
    const token = jwt.sign(
      { userId: user._id, name: user.username, role: user.role, permissions },
      secret,
      { expiresIn: "7d" }
    );

    return res.status(200).json(buildAuthResponse(user, token));
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
    const studentId = getRequestUserId(req);
    const exams = await Exam.find({ isPublished: true }).populate("questions").sort({ createdAt: -1 });

    if (!studentId) return res.status(401).json({ message: "Unauthorized" });

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
    if (!getRequestUserId(req)) return res.status(401).json({ message: "Unauthorized" });
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
  const { examId, answers } = req.body;
  const studentId = getRequestUserId(req);

  try {
    if (!studentId) return res.status(401).json({ message: "Unauthorized" });
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

      // Option Key Correction Logic
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