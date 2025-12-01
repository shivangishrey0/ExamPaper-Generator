import User from "../models/User.js";
import bcrypt from "bcryptjs";

// REGISTER
export const register = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashed,
    });

    await newUser.save();

    return res.json({
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// LOGIN
export const login = async (req, res) => {
  console.log("---- LOGIN DEBUG ----");

  console.log("REQ BODY:", req.body);
  console.log("Email received:", req.body.email);
  console.log("Password received:", req.body.password);

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    console.log("USER FROM DATABASE:", user);

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);

    console.log("PASSWORD MATCH RESULT:", isMatch);

    if (!isMatch)
      return res
        .status(400)
        .json({ success: false, message: "Invalid password" });

    return res.json({
      success: true,
      message: "Login successful",
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


// FORGOT PASSWORD
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    return res.json({
      success: true,
      message: "User found. You can reset the password now.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// RESET PASSWORD
export const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const hashed = await bcrypt.hash(newPassword, 10);

    await User.findOneAndUpdate({ email }, { password: hashed });

    return res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
