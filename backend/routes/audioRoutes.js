import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import Audio from "../models/Audio.js"; // ✅ Import the Audio model

const router = express.Router();

// ✅ Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // folder where files will be saved
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // unique file name
  },
});

const upload = multer({ storage });

// ✅ Upload endpoint (now saves metadata)
router.post("/upload", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { title, artist } = req.body;

    // Save metadata to MongoDB
    const newAudio = new Audio({
      title: title || req.file.originalname,
      artist: artist || "Unknown Artist",
      filePath: `/uploads/${req.file.filename}`,
    });

    await newAudio.save();

    res.status(200).json({
      message: "Audio uploaded and saved successfully",
      audio: newAudio,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error saving audio metadata", error });
  }
});

// ✅ Dynamic audio streaming route
router.get("/stream/:filename", (req, res) => {
  const filePath = path.join("uploads", req.params.filename);

  // check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "Audio file not found" });
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

// ✅ Fetch all uploaded audio files
router.get("/list", async (req, res) => {
  try {
    const audios = await Audio.find().sort({ createdAt: -1 });
    res.json(audios);
  } catch (error) {
    res.status(500).json({ message: "Error fetching audio list", error });
  }
});

// ✅ Test endpoint
router.get("/", (req, res) => {
  res.send("🎵 Audio route working fine, metadata + streaming active!");
});

export default router;
