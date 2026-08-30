import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  subject: { type: String, required: true },
  // Fixed to the values generatePaper's difficulty filters actually recognize,
  // so a typo here can't silently create a question that can never be picked.
  difficulty: { type: String, required: true, enum: ["Easy", "Medium", "Hard"] },
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

// generatePaper always filters by this exact combination.
questionSchema.index({ subject: 1, questionType: 1, difficulty: 1 });

export default mongoose.model("Question", questionSchema);