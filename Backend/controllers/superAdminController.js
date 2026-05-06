import bcrypt from "bcryptjs";
import User from "../models/User.js";

export const createUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const normalizedRole = String(role || "").toLowerCase();

    if (!username || !username.trim())
      return res.status(400).json({ message: "Username is required" });
    if (!email || !email.trim())
      return res.status(400).json({ message: "Email is required" });
    if (!password || password.length < 6)
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    if (!["teacher", "student"].includes(normalizedRole))
      return res.status(400).json({ message: "Role must be teacher or student" });

    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing)
      return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword,
      role: normalizedRole,
      isVerified: true,
      isActive: true,
    });

    return res.status(201).json({
      message: "User created successfully",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Error creating user" });
  }
};

export const listUsers = async (_req, res) => {
  try {
    const users = await User.find(
      {},
      "username email role isActive isVerified createdAt"
    ).sort({ createdAt: -1 });
    return res.json(users);
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

// NEW: Re-activate a previously deactivated user
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

// NEW: Permanently delete a user (cannot delete superadmin)
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
