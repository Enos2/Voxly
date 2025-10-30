import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Audio from "../models/Audio.js";
import { verifyToken } from "../middleware/authMiddleware.js"; // ✅ Secure uploads

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Ensure uploads folder path resolves correctly
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// ✅ Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});
const upload = multer({ storage });

/* ──────────────────────────────────────────────
   📤 Upload audio + save metadata (AUTH REQUIRED)
────────────────────────────────────────────── */
router.post("/upload", verifyToken, upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No audio file uploaded" });

    const { title, artist } = req.body;

    const newAudio = new Audio({
      title: title || req.file.originalname.replace(/\.[^/.]+$/, ""),
      artist: artist || req.user?.username || "Unknown Artist",
      uploader: req.user?.id,
      filePath: `/uploads/${req.file.filename}`,
    });

    await newAudio.save();

    res.status(201).json({
      message: "✅ Audio uploaded successfully",
      audio: newAudio,
    });
  } catch (error) {
    console.error("❌ Error uploading audio:", error);
    res.status(500).json({ message: "Error uploading audio", error });
  }
});

/* ──────────────────────────────────────────────
   🎧 Stream an audio file dynamically
────────────────────────────────────────────── */
router.get("/stream/:filename", (req, res) => {
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
});

/* ──────────────────────────────────────────────
   📜 Get list of all uploaded audios
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
        filename: a.filePath.split("/").pop(),
        uploader: a.uploader,
        createdAt: a.createdAt,
        source: "db",
      })),
      ...missingFiles.map(f => ({
        title: f.replace(/\.[^/.]+$/, ""),
        artist: "Unknown Artist",
        filename: f,
        source: "disk",
      })),
    ];

    res.status(200).json(combinedList);
  } catch (error) {
    console.error("❌ Error fetching audio list:", error);
    res.status(500).json({ message: "Error fetching audio list", error });
  }
});

/* ──────────────────────────────────────────────
   🧠 Health/Test route
────────────────────────────────────────────── */
router.get("/", (req, res) => {
  res.send("🎵 Audio route working — streaming, upload & auth ready!");
});

export default router;
