import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { seedSuperAdmin } from "./config/seedSuperAdmin.js";

// Routes
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import teacherRoutes from "./routes/teacher.js";
import studentRoutes from "./routes/student.js";


const app = express();

// --- 1. FIXED CORS (Allow Frontend to talk to Backend) ---
app.use(cors({
  origin: "http://localhost:5173", // Allow your Frontend
  methods: ["GET", "POST", "PUT", "DELETE","PATCH"],
  credentials: true
}));

app.use(express.json());

// --- 2. FIXED ROUTES (This was the main issue!) ---

// Public auth routes
app.use("/api/auth", authRoutes); 

// Superadmin routes
app.use("/api/superadmin", adminRoutes);

// Teacher routes (paper creation, publish, grading)
app.use("/api/teacher", teacherRoutes);

// Student routes (take exam, own submissions)
app.use("/api/student", studentRoutes);

// Root Check
app.get("/", (req, res) => {
  res.send("Backend Running...");
});

// CONNECT MONGODB
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB Connected");
    await seedSuperAdmin();
  })
  .catch((err) => console.log("DB Error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));