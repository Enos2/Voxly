import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js"; // <-- Use new DB config

// ─────────────────────────────────────────────
//  📍 Environment Variables
// ─────────────────────────────────────────────
dotenv.config();

// Fix for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────
//  🚀 Initialize App
// ─────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// ─────────────────────────────────────────────
//  🧩 Global Middleware
// ─────────────────────────────────────────────
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

// Debug Request Logger
app.use((req, res, next) => {
  console.log(`➡️  ${req.method} ${req.path}`);
  next();
});

// Serve uploaded static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ─────────────────────────────────────────────
//  📦 Import Routes
// ─────────────────────────────────────────────
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import audioRoutes from "./routes/audioRoutes.js";
import interactionRoutes from "./routes/interactionsRoutes.js";
import newsRoutes from "./routes/newsRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";

// ─────────────────────────────────────────────
//  🛠️ Register Routes
// ─────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/audio", audioRoutes);
app.use("/api/interactions", interactionRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/upload", uploadRoutes);

// ─────────────────────────────────────────────
//  🩺 Health Check API
// ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.status(200).json({
    message: "🎧 Voxly API active — Auth, Audio, Profile, News & Interactions are running",
  });
});

// ─────────────────────────────────────────────
//  💾 MongoDB Connection
// ─────────────────────────────────────────────
connectDB(); // <-- Connect using db.js

// ─────────────────────────────────────────────
//  ❌ 404 Handler
// ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    path: req.originalUrl,
  });
});

// ─────────────────────────────────────────────
//  🔥 Global Error Handler
// ─────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err);
  res.status(500).json({
    message: err.message || "Internal Server Error",
  });
});

// ─────────────────────────────────────────────
//  🚀 Start Server
// ─────────────────────────────────────────────
app.listen(PORT, () =>
  console.log(`🚀 Voxly backend running on port ${PORT}`)
);
