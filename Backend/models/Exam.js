import mongoose from "mongoose";

const examSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  totalMarks: { type: Number, default: 100 },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
  
  // --- THIS WAS MISSING ---
  isPublished: { type: Boolean, default: false }, 
  // ------------------------
  duration: { type: Number, default: 0 }, // 0 = Untimed, Number = Minutes

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Exam", examSchema);