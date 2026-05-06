import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);

const hash = await bcrypt.hash("admin@123", 10);

await mongoose.connection.collection("users").updateOne(
  { email: "superadmin@example.com" },
  { $set: { password: hash } }
);

console.log("Done! Login with superadmin@example.com / admin@123");
process.exit(0);