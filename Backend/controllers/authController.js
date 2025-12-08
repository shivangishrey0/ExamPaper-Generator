import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateOTP, otpExpiry } from "../utils/otp.js";
import { sendMail } from "../utils/mailer.js";
import Exam from "../models/Exam.js";
import Submission from "../models/Submission.js";

// ---------------- REGISTER START (SEND OTP) ----------------
export const registerStart = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const expiry = otpExpiry();

    const user = new User({
      username,
      email,
      password: hashedPassword,
      otp,
      otpExpiry: expiry,
    });

    await user.save();

    await sendMail(
      email,
      "Your OTP Code",
      `<p>Your OTP is <b>${otp}</b>. It expires in 10 minutes.</p>`
    );

    res.json({ message: "OTP sent to your email" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ---------------- VERIFY EMAIL ----------------
export const verifyEmail = async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });

  if (user.otp !== otp) 
    return res.status(400).json({ message: "Invalid OTP" });

  if (Date.now() > user.otpExpiry)
    return res.status(400).json({ message: "OTP expired" });

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;

  await user.save();
  res.json({ message: "Email verified successfully" });
};

// ---------------- LOGIN ----------------
export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user)
    return res.status(400).json({ message: "User not found" });

  if (!user.isVerified)
    return res.status(400).json({ message: "Email not verified" });

  const match = await bcrypt.compare(password, user.password);
  if (!match)
    return res.status(400).json({ message: "Incorrect password" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.json({ message: "Login successful", token });
};

// ---------------- FORGOT PASSWORD (SEND OTP) ----------------
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });
  if (!user)
    return res.status(400).json({ message: "Email not found" });

  const otp = generateOTP();
  user.otp = otp;
  user.otpExpiry = otpExpiry();
  await user.save();

  await sendMail(
    email,
    "Password Reset OTP",
    `<p>Your password reset OTP is <b>${otp}</b></p>`
  );

  res.json({ message: "OTP sent to your email" });
};

// ---------------- RESET PASSWORD ----------------
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ email });
  if (!user)
    return res.status(400).json({ message: "User not found" });

  if (user.otp !== otp)
    return res.status(400).json({ message: "Invalid OTP" });

  if (Date.now() > user.otpExpiry)
    return res.status(400).json({ message: "OTP expired" });

  user.password = await bcrypt.hash(newPassword, 10);
  user.otp = undefined;
  user.otpExpiry = undefined;

  await user.save();

  res.json({ message: "Password reset successful" });
};
// --- STUDENT: GET AVAILABLE EXAMS ---
export const getAvailableExams = async (req, res) => {
  try {
    // FIX: Only fetch exams where isPublished is TRUE
    const exams = await Exam.find({ isPublished: true }).sort({ createdAt: -1 });
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: "Error fetching exams" });
  }
};

// --- STUDENT: GET SINGLE EXAM ---
export const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id).populate("questions");
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: "Error loading exam" });
  }
};

// --- STUDENT: SUBMIT EXAM ---
export const submitExam = async (req, res) => {
  const { examId, answers } = req.body;
  
  try {
    const exam = await Exam.findById(examId).populate("questions");
    if (!exam) return res.status(404).json({ message: "Exam not found" });

    let score = 0;
    const total = exam.questions.length;

    // Calculate Score
    exam.questions.forEach((q) => {
      if (answers[q._id] === q.correctAnswer) {
        score++;
      }
    });

    // Note: We are currently just returning the score. 
    // To save it for the Admin to see, we would create a 'Submission' here.
    
    res.json({ 
      message: "Exam Submitted!", 
      score: score, 
      total: total,
      percentage: ((score / total) * 100).toFixed(2)
    });

  } catch (error) {
    res.status(500).json({ message: "Error submitting exam" });
  }
};
