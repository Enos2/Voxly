import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import Audio from "../models/Audio.js";

const router = express.Router();

// ✅ Storage for uploaded audio files
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});

const upload = multer({ storage });

/* ──────────────────────────────────────────────
   📤 Upload audio + save metadata to MongoDB
────────────────────────────────────────────── */
router.post("/upload", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No audio file uploaded" });
    }

    const { title, artist } = req.body;

    const newAudio = new Audio({
      title: title || req.file.originalname.replace(/\.[^/.]+$/, ""), // remove extension
      artist: artist || "Unknown Artist",
      filePath: `/uploads/${req.file.filename}`,
    });

    await newAudio.save();

    res.status(200).json({
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
  const filePath = path.join("uploads", req.params.filename);

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
   📜 Get a list of all uploaded audios
────────────────────────────────────────────── */
router.get("/list", async (req, res) => {
  try {
    const audios = await Audio.find().sort({ createdAt: -1 });
    res.status(200).json(audios);
  } catch (error) {
    console.error("❌ Error fetching audio list:", error);
    res.status(500).json({ message: "Error fetching audio list", error });
  }
});

/* ──────────────────────────────────────────────
   🧠 Test route
────────────────────────────────────────────── */
router.get("/", (req, res) => {
  res.send("🎵 Audio route working fine — metadata & streaming active!");
});

export default router;
