import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import rateLimit from "express-rate-limit";
import { seedSuperAdmin } from "./config/seedSuperAdmin.js";
import { logger } from "./utils/logger.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

// Routes
import authRoutes from "./routes/auth.js";
import superAdminRoutes from "./routes/adminRoutes.js";
import teacherRoutes from "./routes/teacher.js";
import studentRoutes from "./routes/student.js";

const app = express();

// --- CORS ---
// Allow local Vite, the production Vercel app, and preview deployments.
// --- CORS ---
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "https://interactive-assessment-platform.vercel.app",
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(pinoHttp({ logger }));
app.use(cors(corsOptions));
app.options(/(.*)/, cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// --- RATE LIMITING ---  ← ADD THIS BLOCK
const skipPreflight = (req) => req.method === "OPTIONS";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                    // max 10 requests per 15 min
  message: { message: "Too many attempts. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipPreflight,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,                   // max 100 requests per 15 min
  message: { message: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipPreflight,
});

// Apply general limit to all routes
app.use(generalLimiter);

// Apply strict limit to auth routes only
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/forgot-password", authLimiter);
app.use("/api/auth/verify-otp", authLimiter);
app.use("/api/auth/verify-email", authLimiter);
app.use("/api/auth/reset-password", authLimiter);
// ---------------------

// --- ROUTES ---
app.use("/api/auth", authRoutes);
app.use("/api/superadmin", superAdminRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/student", studentRoutes);

app.get("/", (req, res) => {
  res.send("Backend Running...");
});

// Load-balancer / uptime-monitor target: reports whether the process can
// actually reach the database, not just whether Express is running.
app.get("/healthz", (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? "ok" : "error",
    uptime: process.uptime(),
    db: dbConnected ? "connected" : "disconnected",
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

// CONNECT MONGODB
mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    logger.info("MongoDB Connected");
    await seedSuperAdmin();
  })
  .catch((err) => logger.error({ err }, "DB connection failed"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));