import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  subject: { type: String, required: true },
  difficulty: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctAnswer: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Question", questionSchema);