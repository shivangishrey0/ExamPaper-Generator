import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  subject: { type: String, required: true },
  difficulty: { type: String, required: true },
  section: { type: String, default: "Section A" },
  // Make options optional so subjective questions can be stored too
  options: [{ type: String }],
  // Store the type so generation filters work (mcq | short | long)
  questionType: { type: String, enum: ["mcq", "short", "long"], default: "mcq" },
  // MCQ requires correctAnswer; subjective can be blank/omitted
  correctAnswer: { 
    type: String, 
    required: function() { return this.questionType === "mcq"; } 
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Question", questionSchema);