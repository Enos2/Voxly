import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// ✅ Import routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import audioRoutes from "./routes/audioRoutes.js"; // Audio streaming routes

// ✅ Load environment variables
dotenv.config();

// ✅ Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Serve static files (uploads)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Routes
app.use("/api/auth", authRoutes); // 🔐 Authentication
app.use("/api/user", userRoutes); // 👤 User management
app.use("/api/audio", audioRoutes); // 🎵 Audio upload + metadata routes

/* ──────────────────────────────────────────────
   🎧 STREAM ANY AUDIO FILE (Dynamic route)
────────────────────────────────────────────── */
app.get("/api/audio/stream/:filename", (req, res) => {
  const fileName = req.params.filename;
  const filePath = path.join(__dirname, "uploads", fileName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "Audio file not found" });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
    const start = parseInt(startStr, 10);
    const end = endStr ? parseInt(endStr, 10) : fileSize - 1;
    const chunkSize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": "audio/mpeg",
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": "audio/mpeg",
    });
    fs.createReadStream(filePath).pipe(res);
  }
});

/* ──────────────────────────────────────────────
   📜 LIST ALL AUDIO FILES
────────────────────────────────────────────── */
app.get("/api/audio/list", (req, res) => {
  const uploadsDir = path.join(__dirname, "uploads");

  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      console.error("❌ Error reading uploads directory:", err);
      return res.status(500).json({ error: "Error reading uploads folder" });
    }

    // Filter only audio formats
    const audioFiles = files.filter((file) => /\.(mp3|wav|ogg)$/i.test(file));
    res.status(200).json(audioFiles || []);
  });
});

// ✅ Default route
app.get("/", (req, res) => {
  res.send("🎙️ Voxly API is active — Auth, Users & Streaming ready!");
});

// ✅ MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection failed:", err));

// ✅ Start the server
app.listen(PORT, () => {
  console.log(`🚀 Voxly backend running on port ${PORT}`);
});
