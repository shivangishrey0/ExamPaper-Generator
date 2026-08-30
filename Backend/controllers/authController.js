import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { generateOTP, otpExpiry } from "../utils/otp.js";
import { sendMail } from "../utils/mailer.js";
import Exam from "../models/Exam.js";
import Submission from "../models/submission.js";
import { getPermissionsForRole } from "../utils/permissions.js";
import { logger } from "../utils/logger.js";

const getRequestUserId = (req) => req.user?.userId || req.user?.id;

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
// Scoped to /api/auth so the cookie is only ever sent to the endpoints that need it.
const REFRESH_COOKIE_PATH = "/api/auth";

const getAccessSecret = () => process.env.JWT_SECRET;
// Falls back to the access secret so this works with just JWT_SECRET set, but a
// separate REFRESH secret means a leaked access-token secret alone can't be
// used to mint long-lived refresh tokens.
const getRefreshSecret = () => process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

const signAccessToken = (user) => {
  const permissions = getPermissionsForRole(user.role);
  return jwt.sign(
    { userId: user._id, name: user.username, role: user.role, permissions },
    getAccessSecret(),
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

const signRefreshToken = (user) =>
  jwt.sign({ userId: user._id, type: "refresh" }, getRefreshSecret(), { expiresIn: REFRESH_TOKEN_EXPIRY });

const setRefreshCookie = (res, refreshToken) => {
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
    path: REFRESH_COOKIE_PATH,
  });
};

const buildAuthResponse = (user, accessToken) => {
  const permissions = getPermissionsForRole(user.role);
  return {
    message: "Login successful",
    token: accessToken,
    userId: user._id,
    name: user.username,
    role: user.role,
    permissions
  };
};

export const resolveLoginUser = async ({ email, username }) => {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedUsername = String(username || "").trim();

  if (normalizedEmail) {
    const byEmail = await User.findOne({ email: normalizedEmail });
    if (byEmail) return byEmail;
  }

  if (normalizedUsername) {
    return User.findOne({ username: normalizedUsername });
  }

  return null;
};

// --- REGISTER ---
export const register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const normalizedRole = String(role || "student").toLowerCase();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedUsername = String(username || "").trim();

    // Validation
    if (!normalizedUsername) {
      return res.status(400).json({ message: "Username is required" });
    }
    if (!normalizedEmail) {
      return res.status(400).json({ message: "Email is required" });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    if (!["teacher", "student"].includes(normalizedRole)) {
      return res.status(400).json({ message: "Role must be teacher or student" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const expiry = otpExpiry();

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists?.isVerified) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Reuse a leftover unverified row instead of blocking re-registration
    const user = exists || new User({ email: normalizedEmail });
    user.username = normalizedUsername;
    user.password = hashedPassword;
    user.role = normalizedRole;
    user.otp = otp;
    user.otpExpiry = expiry;
    user.isVerified = false;
    await user.save();

    try {
      await sendMail(normalizedEmail, "Verify Your Account", `<p>Your verification OTP is: <b>${otp}</b></p>`);
    } catch (emailError) {
      logger.error({ err: emailError }, "Email sending failed");
      return res.status(500).json({ message: "Could not send verification email. Please try again." });
    }

    res.json({ message: "OTP sent successfully" });
  } catch (err) {
    logger.error({ err }, "Register error");
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
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const submittedOtp = String(otp || "").trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) return res.status(400).json({ message: "User not found" });
    if (!user.otp || String(user.otp) !== submittedOtp) return res.status(400).json({ message: "Invalid OTP" });
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
    const { email, username, password } = req.body;
    const user = await resolveLoginUser({ email, username });

    if (!user) return res.status(400).json({ message: "User not found" });
    if (!user.isActive) return res.status(403).json({ message: "Account is deactivated" });
    if (!user.isVerified) return res.status(400).json({ message: "Email not verified" });
    if (!user.password) return res.status(400).json({ message: "Password is not set for this account. Please use the invite flow." });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Incorrect password" });

    if (!getAccessSecret()) {
      return res.status(500).json({ message: "JWT secret is not configured" });
    }

    const accessToken = signAccessToken(user);
    setRefreshCookie(res, signRefreshToken(user));

    return res.status(200).json(buildAuthResponse(user, accessToken));
  } catch (error) {
    logger.error({ err: error }, "Login error");
    return res.status(500).json({ message: "Server Error" });
  }
};

export const adminLogin = login;

// --- REFRESH ACCESS TOKEN ---
// Public route — auth comes from the httpOnly refresh cookie, not a Bearer header.
export const refresh = async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) return res.status(401).json({ message: "No refresh token" });

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, getRefreshSecret());
    } catch {
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }
    if (decoded.type !== "refresh") {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "Account is deactivated" });
    }

    const accessToken = signAccessToken(user);
    // Rotate the refresh token too, so each one is only ever used once.
    setRefreshCookie(res, signRefreshToken(user));

    return res.status(200).json(buildAuthResponse(user, accessToken));
  } catch (error) {
    logger.error({ err: error }, "Refresh error");
    return res.status(500).json({ message: "Server Error" });
  }
};

// --- LOGOUT ---
export const logout = (req, res) => {
  res.clearCookie("refreshToken", { path: REFRESH_COOKIE_PATH });
  res.json({ message: "Logged out" });
};

// --- FORGOT PASSWORD ---
export const forgotPassword = async (req, res) => {
  try {
    const normalizedEmail = String(req.body.email || "").trim().toLowerCase();
    if (!normalizedEmail) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ message: "User with this email does not exist" });

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = otpExpiry();
    await user.save();

    await sendMail(normalizedEmail, "Reset Password Request", `
      <h3>Password Reset</h3>
      <p>Your OTP is: <b style="font-size: 20px;">${otp}</b></p>
      <p>This OTP is valid for 10 minutes.</p>
    `);
    res.json({ message: "OTP sent to your email" });
  } catch (error) {
    logger.error({ err: error }, "Forgot password error");
    res.status(500).json({ message: "Error sending email" });
  }
};

// --- RESET PASSWORD ---
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const submittedOtp = String(otp || "").trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });
    if (!user.otp || String(user.otp) !== submittedOtp) return res.status(400).json({ message: "Invalid OTP" });
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
    if (error.code === 11000) {
      return res.status(400).json({ message: "Already submitted." });
    }
    logger.error({ err: error }, "Submit error");
    res.status(500).json({ message: "Error submitting exam" });
  }
};