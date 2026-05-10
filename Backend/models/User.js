import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username:  { type: String, required: true },
    email:     { type: String, required: true, unique: true },
    password:  { type: String },          // optional until user sets it via invite
    role: {
      type: String,
      enum: ["superadmin", "teacher", "student"],
      default: "student"
    },
    isActive:   { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },

    // OTP fields (forgot password / email verify)
    otp:       { type: String },
    otpExpiry: { type: Number },

    // Invite fields
    inviteToken:  { type: String },       // random token sent in email link
    inviteExpiry: { type: Number },       // timestamp — expires in 24 hours
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);