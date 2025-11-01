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

// Debug Middleware (optional)
app.use((req, res, next) => {
  console.log("🟢 Incoming Request:");
  console.log("➡️ Method:", req.method);
  console.log("➡️ Path:", req.path);
  console.log("➡️ Headers:", req.headers["content-type"]);
  console.log("➡️ Body:", req.body);
  console.log("───────────────────────────────");
  next();
});

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ──────────────────────────────────────────────
   📦 Import Routes
────────────────────────────────────────────── */
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import audioRoutes from "./routes/audioRoutes.js";
import interactionRoutes from "./routes/interactionRoutes.js";
import newsRoutes from "./routes/newsRoutes.js";
import profileRoutes from "./routes/profileRoutes.js"; // ✅ Added

/* ──────────────────────────────────────────────
   🛠️ Register Routes
────────────────────────────────────────────── */
app.use("/api/auth", authRoutes);          // 🔐 Authentication
app.use("/api/user", userRoutes);          // 👤 User routes
app.use("/api/audio", audioRoutes);        // 🎵 Audio upload & streaming
app.use("/api/interactions", interactionRoutes); // 💬 Likes/comments system
app.use("/api/news", newsRoutes);          // 📰 News & updates
app.use("/api/profile", profileRoutes);    // 🧩 Profile routes ✅ NEW

/* ──────────────────────────────────────────────
   🩺 Health Check Route
────────────────────────────────────────────── */
app.get("/", (req, res) => {
  res
    .status(200)
    .send("🎧 Voxly API active — Auth, Profile, Audio, and Interactions running smoothly!");
});

/* ──────────────────────────────────────────────
   💾 MongoDB Connection
────────────────────────────────────────────── */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err));

/* ──────────────────────────────────────────────
   🚀 Start Server
────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`🚀 Voxly backend running on port ${PORT}`);
});
