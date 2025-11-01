import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Audio from "../models/audioModel.js"; // ✅ Make sure the name matches your file
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

/* ──────────────────────────────────────────────
 🎚️ Multer configuration
────────────────────────────────────────────── */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) =>
    cb(
      null,
      `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(
        file.originalname
      )}`
    ),
});

const fileFilter = (req, file, cb) => {
  const allowed = /audio\/(mpeg|mp3|wav|ogg|m4a)/;
  if (allowed.test(file.mimetype)) cb(null, true);
  else cb(new Error("Only audio files are allowed"), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

/* ──────────────────────────────────────────────
 📤 Upload Audio (authenticated)
────────────────────────────────────────────── */
router.post("/upload", verifyToken, upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No audio file uploaded" });

    const { title, artist, description, genre, isPublic } = req.body;

    const newAudio = new Audio({
      title: title || req.file.originalname.replace(/\.[^/.]+$/, ""),
      artist: artist || req.user?.username || "Unknown Artist",
      description: description || "",
      genre: genre || "Unknown",
      isPublic: isPublic ?? true,
      uploader: req.user.id,
      filePath: `/uploads/${req.file.filename}`,
    });

    await newAudio.save();

    res.status(201).json({
      message: "✅ Audio uploaded successfully!",
      audio: {
        ...newAudio._doc,
        streamUrl: `${req.protocol}://${req.get("host")}/api/audio/stream/${req.file.filename}`,
      },
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({ message: "Error uploading audio", error: error.message });
  }
});

/* ──────────────────────────────────────────────
 🎧 Stream Audio
────────────────────────────────────────────── */
router.get("/stream/:filename", (req, res) => {
  try {
    const filePath = path.join(uploadsDir, req.params.filename);
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

      res.writeHead(206, {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize,
        "Content-Type": "audio/mpeg",
      });

      file.pipe(res);
    } else {
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": "audio/mpeg",
      });
      fs.createReadStream(filePath).pipe(res);
    }
  } catch (error) {
    console.error("❌ Streaming error:", error);
    res.status(500).json({ message: "Error streaming audio" });
  }
});

/* ──────────────────────────────────────────────
 📜 Get All Audio (database + disk)
────────────────────────────────────────────── */
router.get("/list", async (req, res) => {
  try {
    const dbAudios = await Audio.find().sort({ createdAt: -1 });
    const filesOnDisk = fs.readdirSync(uploadsDir).filter(f => /\.(mp3|wav|m4a|ogg)$/i.test(f));

    const dbFileNames = dbAudios.map(a => a.filePath.split("/").pop());
    const missingFiles = filesOnDisk.filter(f => !dbFileNames.includes(f));

    const combinedList = [
      ...dbAudios.map(a => ({
        _id: a._id,
        title: a.title,
        artist: a.artist,
        genre: a.genre,
        filename: a.filePath.split("/").pop(),
        uploader: a.uploader,
        createdAt: a.createdAt,
        source: "db",
        streamUrl: `${req.protocol}://${req.get("host")}/api/audio/stream/${a.filePath.split("/").pop()}`,
      })),
      ...missingFiles.map(f => ({
        title: f.replace(/\.[^/.]+$/, ""),
        artist: "Unknown Artist",
        genre: "Unknown",
        filename: f,
        source: "disk",
        streamUrl: `${req.protocol}://${req.get("host")}/api/audio/stream/${f}`,
      })),
    ];

    res.status(200).json(combinedList);
  } catch (error) {
    console.error("❌ Fetch error:", error);
    res.status(500).json({ message: "Error fetching audio list", error: error.message });
  }
});

/* ──────────────────────────────────────────────
 🧠 Health/Test route
────────────────────────────────────────────── */
router.get("/", (req, res) => {
  res.send("🎵 Audio route active — upload, stream, list ready!");
});

export default router;
