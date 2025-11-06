import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

/* ──────────────────────────────────────────────
 ⚙️ Load Environment Variables
────────────────────────────────────────────── */
dotenv.config();

/* ──────────────────────────────────────────────
 📍 Fix for __dirname in ES Modules
────────────────────────────────────────────── */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ──────────────────────────────────────────────
 🚀 Initialize Express App
────────────────────────────────────────────── */
const app = express();
const PORT = process.env.PORT || 5000;

/* ──────────────────────────────────────────────
 🧩 Global Middleware
────────────────────────────────────────────── */
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// 🪵 Debug Middleware
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.path}`);
  next();
});

// 🗂️ Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ──────────────────────────────────────────────
 📦 Import Routes
────────────────────────────────────────────── */
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import audioRoutes from "./routes/audioRoutes.js";
import interactionRoutes from "./routes/interactionRoutes.js";
import newsRoutes from "./routes/newsRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";

/* ──────────────────────────────────────────────
 🛠️ Register Routes
────────────────────────────────────────────── */
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/audio", audioRoutes);
app.use("/api/interactions", interactionRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/profile", profileRoutes);

/* ──────────────────────────────────────────────
 🩺 Health Check Route
────────────────────────────────────────────── */
app.get("/", (req, res) => {
  res.status(200).send("🎧 Voxly API active — Auth, Profile, Audio, Interactions online!");
});

/* ──────────────────────────────────────────────
 💾 MongoDB Connection
────────────────────────────────────────────── */
mongoose
  .connect(process.env.MONGO_URI, { dbName: "voxly" })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err));

/* ──────────────────────────────────────────────
 🧯 Global Error Handler
────────────────────────────────────────────── */
app.use((err, req, res, next) => {
  console.error("🔥 Uncaught Error:", err);
  res.status(500).json({ message: err.message || "Internal Server Error" });
});

/* ──────────────────────────────────────────────
 🚀 Start Server
────────────────────────────────────────────── */
app.listen(PORT, () => console.log(`🚀 Voxly backend running on port ${PORT}`));
