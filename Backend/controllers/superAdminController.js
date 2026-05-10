import crypto from "crypto";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { sendMail } from "../utils/mailer.js";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const INVITE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

// --- INVITE USER (replaces createUser with password) ---
export const inviteUser = async (req, res) => {
  try {
    const { username, email, role } = req.body;
    const normalizedRole = String(role || "").toLowerCase();

    if (!username || !username.trim())
      return res.status(400).json({ message: "Username is required" });
    if (!email || !email.trim())
      return res.status(400).json({ message: "Email is required" });
    if (!["teacher", "student"].includes(normalizedRole))
      return res.status(400).json({ message: "Role must be teacher or student" });

    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing)
      return res.status(400).json({ message: "Email already exists" });

    // Generate a secure random token
    const inviteToken = crypto.randomBytes(32).toString("hex");
    const inviteExpiry = Date.now() + INVITE_EXPIRY_MS;

    // Create user WITHOUT a password — they will set it themselves
    const user = await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      role: normalizedRole,
      isVerified: false,  // becomes true after they set password
      isActive: true,
      inviteToken,
      inviteExpiry,
    });

    // Build the invite link
    const inviteLink = `${FRONTEND_URL}/set-password?token=${inviteToken}`;

    // Send invite email
    try {
      await sendMail(
        user.email,
        "You've been invited to Exam Portal",
        `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1a1a1a;">Hello, ${user.username}!</h2>
          <p style="color: #555;">
            You have been invited to join <strong>Exam Portal</strong> as a 
            <strong>${normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1)}</strong>.
          </p>
          <p style="color: #555;">Click the button below to set your password and activate your account.</p>

          <a href="${inviteLink}"
             style="display:inline-block; background:#1a1a1a; color:#fff; padding:12px 28px;
                    border-radius:8px; text-decoration:none; margin: 16px 0; font-weight:bold;">
            Set My Password
          </a>

          <p style="color:#888; font-size:13px;">
            This link will expire in <strong>24 hours</strong>. 
            If you did not expect this invitation, you can ignore this email.
          </p>

          <hr style="border:none; border-top:1px solid #eee; margin:24px 0;">
          <p style="color:#aaa; font-size:12px;">Exam Portal &mdash; Invite link expires at ${new Date(inviteExpiry).toLocaleString()}</p>
        </div>
        `
      );
    } catch (emailError) {
      console.error("Invite email failed:", emailError.message);
      // Still created the user — superadmin can resend
    }

    return res.status(201).json({
      message: `Invite sent to ${user.email}. They have 24 hours to set their password.`,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error("Invite error:", error);
    return res.status(500).json({ message: "Error sending invite" });
  }
};

// --- RESEND INVITE ---
export const resendInvite = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) return res.status(400).json({ message: "User already activated" });

    const inviteToken = crypto.randomBytes(32).toString("hex");
    const inviteExpiry = Date.now() + INVITE_EXPIRY_MS;

    user.inviteToken = inviteToken;
    user.inviteExpiry = inviteExpiry;
    await user.save();

    const inviteLink = `${process.env.FRONTEND_URL || "http://localhost:5173"}/set-password?token=${inviteToken}`;

    await sendMail(
      user.email,
      "Your Exam Portal invite link (resent)",
      `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #1a1a1a;">Hello, ${user.username}!</h2>
        <p style="color: #555;">Here is your new invite link. The previous one has been invalidated.</p>
        <a href="${inviteLink}"
           style="display:inline-block; background:#1a1a1a; color:#fff; padding:12px 28px;
                  border-radius:8px; text-decoration:none; margin:16px 0; font-weight:bold;">
          Set My Password
        </a>
        <p style="color:#888; font-size:13px;">This link expires in 24 hours.</p>
      </div>
      `
    );

    return res.json({ message: `Invite resent to ${user.email}` });
  } catch (error) {
    return res.status(500).json({ message: "Error resending invite" });
  }
};

// --- SET PASSWORD (called by user from invite link) ---
// This is a PUBLIC route — no auth required
export const setPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token) return res.status(400).json({ message: "Invalid invite link" });
    if (!password || password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });

    const user = await User.findOne({ inviteToken: token });
    if (!user) return res.status(400).json({ message: "Invalid or already used invite link" });
    if (user.inviteExpiry < Date.now())
      return res.status(400).json({ message: "Invite link has expired. Ask your admin to resend." });

    // Set password and activate account
    user.password = await bcrypt.hash(password, 10);
    user.isVerified = true;
    user.inviteToken = undefined;   // clear the token — can't be reused
    user.inviteExpiry = undefined;
    await user.save();

    return res.json({ message: "Password set successfully! You can now log in." });
  } catch (error) {
    return res.status(500).json({ message: "Error setting password" });
  }
};

// --- PAGINATED LIST USERS ---
export const listUsers = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 8);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.role && ["teacher", "student"].includes(req.query.role)) {
      filter.role = req.query.role;
    }
    if (req.query.search && req.query.search.trim()) {
      const regex = new RegExp(req.query.search.trim(), "i");
      filter.$or = [{ username: regex }, { email: regex }];
    }

    const [users, total] = await Promise.all([
      User.find(filter, "username email role isActive isVerified createdAt inviteExpiry")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return res.json({ users, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching users" });
  }
};

export const deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "superadmin")
      return res.status(400).json({ message: "Cannot deactivate superadmin" });
    user.isActive = false;
    await user.save();
    return res.json({ message: "User deactivated" });
  } catch (error) {
    return res.status(500).json({ message: "Error deactivating user" });
  }
};

export const activateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.isActive = true;
    await user.save();
    return res.json({ message: "User activated" });
  } catch (error) {
    return res.status(500).json({ message: "Error activating user" });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "superadmin")
      return res.status(400).json({ message: "Cannot delete superadmin" });
    await User.findByIdAndDelete(req.params.id);
    return res.json({ message: "User deleted permanently" });
  } catch (error) {
    return res.status(500).json({ message: "Error deleting user" });
  }
};