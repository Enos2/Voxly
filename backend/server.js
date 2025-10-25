import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import userRoutes from "./routes/userRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import audioRoutes from "./routes/audioRoutes.js"; // Audio streaming routes

// ✅ Load environment variables
dotenv.config();

// ✅ Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware
app.use(express.json());
app.use(cors());

// ✅ Serve static files from "uploads" folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Connect routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/audio", audioRoutes);

// ✅ STREAM ANY AUDIO FILE (Dynamic route)
app.get("/api/audio/stream/:filename", (req, res) => {
  const fileName = req.params.filename;
  const filePath = path.join(__dirname, "uploads", fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("Audio file not found!");
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": "audio/mpeg",
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      "Content-Length": fileSize,
      "Content-Type": "audio/mpeg",
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

// ✅ GET LIST OF ALL AUDIO FILES
app.get("/api/audio/list", (req, res) => {
  const uploadsDir = path.join(__dirname, "uploads");

  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      console.error("Error reading uploads directory:", err);
      return res.status(500).json({ error: "Error reading uploads folder" });
    }

    // Filter only audio files
    const audioFiles = files.filter(file => /\.(mp3|wav|ogg)$/i.test(file));

    // ✅ Always return an array — even if empty
    res.json(audioFiles);
  });
});

// ✅ Default route
app.get("/", (req, res) => {
  res.send("🎙️ Welcome to Voxly API — streaming active!");
});

// ✅ MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err));

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
