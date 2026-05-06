import bcrypt from "bcryptjs";
import User from "../models/User.js";

export const seedSuperAdmin = async () => {
  const email = (process.env.SUPERADMIN_EMAIL || "superadmin@example.com").trim().toLowerCase();
  const username = (process.env.SUPERADMIN_NAME || "Super Admin").trim();
  const password = process.env.SUPERADMIN_PASSWORD || "SuperAdmin@123";

  const exists = await User.findOne({ role: "superadmin" });
  if (exists) {
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  await User.create({
    username,
    email,
    password: hashedPassword,
    role: "superadmin",
    isVerified: true,
    isActive: true
  });

  console.log("Seeded default superadmin account");
};
