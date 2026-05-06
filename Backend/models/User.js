import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["superadmin", "teacher", "student"],
      default: "student"
    },
    isActive: { type: Boolean, default: true },

    isVerified: { type: Boolean, default: false },

    otp: { type: String },
    otpExpiry: { type: Number }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
