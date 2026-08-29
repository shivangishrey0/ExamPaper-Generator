import bcrypt from "bcryptjs";
import User from "../models/User.js";

export const seedSuperAdmin = async () => {
  const email = (process.env.SUPERADMIN_EMAIL || "superadmin@example.com").trim().toLowerCase();
  const username = (process.env.SUPERADMIN_NAME || "Super Admin").trim();
  const password = process.env.SUPERADMIN_PASSWORD || "SuperAdmin@123";

  const existing = await User.findOne({ role: "superadmin" });
  if (existing) {
    const needsPasswordRefresh = !existing.password || !(await bcrypt.compare(password, existing.password));

    if (needsPasswordRefresh) {
      existing.password = await bcrypt.hash(password, 10);
      existing.email = email;
      existing.username = username;
      existing.isVerified = true;
      existing.isActive = true;
      await existing.save();
      console.log("Updated default superadmin password");
    }
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
