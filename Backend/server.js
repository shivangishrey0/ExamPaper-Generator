import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";


const app = express();
app.use(cors());
app.use(express.json());

// User Routes
app.use("/api/user", authRoutes);

// Admin Routes
app.use("/api/admin", adminRoutes);

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
