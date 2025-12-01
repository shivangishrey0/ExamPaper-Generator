import mongoose from "mongoose";

const resetTokenSchema = new mongoose.Schema({
  email: String,
  otp: String,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300  // token expires after 5 minutes
  }
});

export default mongoose.model("ResetToken", resetTokenSchema);
