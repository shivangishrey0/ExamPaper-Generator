export const adminLogin = (req, res) => {
  const { username, password } = req.body;

  const ADMIN_USER = "admin";
  const ADMIN_PASS = "admin123";

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return res.json({ message: "Admin login success" });
  }

  return res.status(400).json({ message: "Invalid admin credentials" });
};
