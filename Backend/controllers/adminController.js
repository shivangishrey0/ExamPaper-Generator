import User from "./models/User.js";
import ResetToken from "../models/ResetToken.js";

export const adminLogin = (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "admin123") {
    return res.json({ msg: "Admin Login Successful" });
  }

  return res.status(400).json({ msg: "Invalid Credentials" });
};
