import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import rateLimit from "express-rate-limit";  // ← ADD THIS
import { seedSuperAdmin } from "./config/seedSuperAdmin.js";

// Routes
import authRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import teacherRoutes from "./routes/teacher.js";
import studentRoutes from "./routes/student.js";

const app = express();

// --- CORS ---
app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  credentials: true
}));

app.use(express.json());

// --- RATE LIMITING ---  ← ADD THIS BLOCK
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                    // max 10 requests per 15 min
  message: { message: "Too many attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // max 100 requests per 15 min
  message: { message: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general limit to all routes
app.use(generalLimiter);

// Apply strict limit to auth routes only
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);
// ---------------------

// --- ROUTES ---
app.use("/api/auth", authRoutes);
app.use("/api/superadmin", adminRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/student", studentRoutes);

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