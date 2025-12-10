import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { verifyToken, adminOnly } from "../middleware/authMiddleware.js";

// 🎧 Controller functions
import {
  uploadAudio,
  streamAudio,
  likeAudio,
  saveReplay,
  commentAudio,
  moderateAudio,
  deleteAudio,
} from "../controllers/audioController.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Ensure uploads directory exists ─────────────────
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ── Multer config ───────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});

const fileFilter = (req, file, cb) => {
  const allowed = /audio\/(mpeg|mp3|wav|ogg|m4a)/;
  allowed.test(file.mimetype) ? cb(null, true) : cb(new Error("Only audio files allowed"), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 100 * 1024 * 1024 } });

// ── Routes ──────────────────────────────────────────

// Upload audio (protected)
router.post("/upload", verifyToken, upload.single("audio"), uploadAudio);

// Stream audio (public)
router.get("/stream/:id", streamAudio);

// List audio files (public)
router.get("/list", async (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir).filter(f => /\.(mp3|wav|ogg|m4a)$/i.test(f));
    const response = files.map(f => ({
      title: f.replace(/\.(mp3|wav|ogg|m4a)$/i, ""),
      streamUrl: `${req.protocol}://${req.get("host")}/uploads/${encodeURIComponent(f)}`,
    }));
    res.status(200).json(response);
  } catch (err) {
    console.error("❌ List error:", err);
    res.status(500).json({ message: "Failed to list audio files", error: err.message });
  }
});

// Like / Unlike audio (protected)
router.post("/like/:id", verifyToken, likeAudio);

// Comment on audio (protected)
router.post("/comment/:id", verifyToken, commentAudio);

// Save replay (protected)
router.post("/replay/save", verifyToken, saveReplay);

// Moderate audio (admin only)
router.post("/moderate/:id", verifyToken, adminOnly, moderateAudio);

// Delete audio (uploader or admin)
router.delete("/:id", verifyToken, deleteAudio);

// Health/test route
router.get("/", (req, res) => {
  res.send("🎵 Audio routes active — upload, stream, list, like, comment, replay, delete, moderate ready!");
});

export default router;
