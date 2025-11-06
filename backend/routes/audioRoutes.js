import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { verifyToken } from "../middleware/authMiddleware.js";

// 🎧 Import controller functions
import {
  uploadAudio,
  streamAudio,
  likeAudio,
  saveReplay,
  commentAudio,
  moderateAudio,
} from "../controllers/audioController.js";

import Audio from "../models/Audio.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ──────────────────────────────────────────────
 📂 Ensure uploads directory exists
────────────────────────────────────────────── */
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

/* ──────────────────────────────────────────────
 🎚️ Multer configuration
────────────────────────────────────────────── */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});

const fileFilter = (req, file, cb) => {
  const allowed = /audio\/(mpeg|mp3|wav|ogg|m4a)/;
  if (allowed.test(file.mimetype)) cb(null, true);
  else cb(new Error("Only audio files are allowed"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
});

/* ──────────────────────────────────────────────
 📤 Upload Audio or Live Replay
────────────────────────────────────────────── */
router.post("/upload", verifyToken, upload.single("audio"), uploadAudio);

/* ──────────────────────────────────────────────
 🎧 Stream Audio + Increment Plays
────────────────────────────────────────────── */
router.get("/stream/:id", streamAudio);

/* ──────────────────────────────────────────────
 📜 Get All Audio
────────────────────────────────────────────── */
router.get("/list", async (req, res) => {
  try {
    const audios = await Audio.find().populate("uploader", "username email").sort({ createdAt: -1 });
    const response = audios.map(a => ({
      ...a._doc,
      streamUrl: `${req.protocol}://${req.get("host")}/api/audio/stream/${a._id}`,
    }));
    res.status(200).json(response);
  } catch (error) {
    console.error("❌ Fetch error:", error);
    res.status(500).json({ message: "Error fetching audio list", error: error.message });
  }
});

/* ──────────────────────────────────────────────
 ▶️ Like / Unlike
────────────────────────────────────────────── */
router.post("/like/:id", verifyToken, likeAudio);

/* ──────────────────────────────────────────────
 💬 Comment on Audio
────────────────────────────────────────────── */
router.post("/comment/:id", verifyToken, commentAudio);

/* ──────────────────────────────────────────────
 💾 Save Replay (creator only)
────────────────────────────────────────────── */
router.post("/replay/save", verifyToken, saveReplay);

/* ──────────────────────────────────────────────
 ⚖️ Moderate Audio (admin use)
────────────────────────────────────────────── */
router.post("/moderate/:id", verifyToken, moderateAudio);

/* ──────────────────────────────────────────────
 🗑️ Delete Audio (uploader or admin)
────────────────────────────────────────────── */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const audio = await Audio.findById(req.params.id);
    if (!audio) return res.status(404).json({ message: "Audio not found" });

    if (audio.uploader.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized to delete this audio" });
    }

    const filePath = path.join(uploadsDir, audio.filePath.split("/").pop());
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await audio.deleteOne();
    res.json({ message: "✅ Audio deleted successfully" });
  } catch (error) {
    console.error("❌ Delete error:", error);
    res.status(500).json({ message: "Error deleting audio" });
  }
});

/* ──────────────────────────────────────────────
 🧠 Health/Test route
────────────────────────────────────────────── */
router.get("/", (req, res) => {
  res.send("🎵 Audio routes active — upload, stream, list, like, comment, replay, delete, moderate ready!");
});

export default router;
