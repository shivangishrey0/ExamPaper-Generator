import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  examId: { type: mongoose.Schema.Types.ObjectId, ref: "Exam", required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  answers: { type: Object, required: true }, // { "questionId": "Option A" }
  score: { type: Number, default: 0 },
  isGraded: { type: Boolean, default: false }, // False until Admin checks it
  createdAt: { type: Date, default: Date.now }
});

// FIX: Check if model exists before creating it
export default mongoose.models.Submission || mongoose.model("Submission", submissionSchema);