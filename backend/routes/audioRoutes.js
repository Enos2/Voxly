import express from "express";
import multer from "multer";
import path from "path";

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

// ✅ Route to upload audio
router.post("/upload", upload.single("audio"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  res.status(200).json({
    message: "Audio uploaded successfully",
    filePath: `/uploads/${req.file.filename}`,
  });
});

// ✅ Route to test the upload endpoint
router.get("/", (req, res) => {
  res.send("🎵 Audio route working fine!");
});

export default router;
