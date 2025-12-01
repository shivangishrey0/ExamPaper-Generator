import express from "express";
const router = express.Router();

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

router.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({
      success: false,
      msg: "Invalid admin credentials"
    });
  }

  return res.json({
    success: true,
    msg: "Admin login successful"
  });
});

export default router;
