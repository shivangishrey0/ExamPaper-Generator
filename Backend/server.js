import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";

// Routes
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/UserRoutes.js";

const app = express();

// --- 1. FIXED CORS (Allow Frontend to talk to Backend) ---
app.use(cors({
  origin: "http://localhost:5173", // Allow your Frontend
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// --- 2. FIXED ROUTES (This was the main issue!) ---

// Mount Auth Routes to /api/auth (So frontend /api/auth/login works)
app.use("/api/auth", authRoutes); 

// Mount Admin Routes
app.use("/api/admin", adminRoutes);

// Mount User Routes (For exams)
app.use("/api/user", userRoutes);

// Root Check
app.get("/", (req, res) => {
  res.send("Backend Running...");
});

// CONNECT MONGODB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("DB Error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));