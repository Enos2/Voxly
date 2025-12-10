import Audio from "../models/Audio.js";
import User from "../models/userModel.js";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";

// ✅ UPLOAD AUDIO or LIVE REPLAY
export const uploadAudio = async (req, res) => {
  try {
    const { title, description, artist, genre, language, moodTags, liveStreamId, soundEffects } = req.body;
    const uploader = req.user._id;

    if (!req.file && !liveStreamId) {
      return res.status(400).json({ message: "No audio file or live stream ID provided" });
    }

    const filePath = req.file ? req.file.path : null;

    const newAudio = new Audio({
      title,
      description,
      artist,
      uploader,
      genre,
      language,
      moodTags: moodTags ? moodTags.split(",") : [],
      filePath,
      liveStreamId: liveStreamId || null,
      replayAvailable: !!liveStreamId,
      soundEffects: soundEffects
        ? soundEffects.map(effect => ({
            name: effect.name,
            fileUrl: effect.fileUrl,
            addedBy: uploader,
          }))
        : [],
    });

    await newAudio.save();
    res.status(201).json({ message: "Audio uploaded successfully", audio: newAudio });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Failed to upload audio", error: error.message });
  }
};

// ✅ STREAM AUDIO (increments plays)
export const streamAudio = async (req, res) => {
  try {
    const { id } = req.params;
    const audio = await Audio.findById(id);

    if (!audio) return res.status(404).json({ message: "Audio not found" });

    // Increment play count
    audio.plays += 1;
    audio.analytics.lastPlayedAt = new Date();
    await audio.save();

    const filePath = path.resolve(audio.filePath);
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
  } catch (error) {
    console.error("Stream error:", error);
    res.status(500).json({ message: "Failed to stream audio", error: error.message });
  }
};

// ✅ LIKE AUDIO
export const likeAudio = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const audio = await Audio.findById(id);
    if (!audio) return res.status(404).json({ message: "Audio not found" });

    const index = audio.likes.indexOf(userId);
    if (index === -1) {
      audio.likes.push(userId);
    } else {
      audio.likes.splice(index, 1);
    }

    await audio.save();
    res.status(200).json({ message: "Like status updated", likes: audio.likes.length });
  } catch (error) {
    console.error("Like error:", error);
    res.status(500).json({ message: "Failed to like audio", error: error.message });
  }
};

// ✅ SAVE LIVE REPLAY
export const saveReplay = async (req, res) => {
  try {
    const { liveStreamId, filePath } = req.body;

    if (!liveStreamId || !filePath) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const audio = await Audio.findOne({ liveStreamId });
    if (!audio) return res.status(404).json({ message: "Live stream not found" });

    audio.filePath = filePath;
    audio.replayAvailable = true;
    await audio.save();

    res.status(200).json({ message: "Replay saved successfully", audio });
  } catch (error) {
    console.error("Replay save error:", error);
    res.status(500).json({ message: "Failed to save replay", error: error.message });
  }
};

// ✅ COMMENT AUDIO
export const commentAudio = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    const audio = await Audio.findById(id);
    if (!audio) return res.status(404).json({ message: "Audio not found" });

    audio.comments.push({ user: userId, text });
    await audio.save();

    res.status(200).json({ message: "Comment added", comments: audio.comments });
  } catch (error) {
    console.error("Comment error:", error);
    res.status(500).json({ message: "Failed to add comment", error: error.message });
  }
};

// ✅ AI MODERATION (Admin use)
export const moderateAudio = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const audio = await Audio.findById(id);
    if (!audio) return res.status(404).json({ message: "Audio not found" });

    audio.moderation = {
      reviewed: true,
      status,
      reason,
    };
    await audio.save();

    res.status(200).json({ message: "Audio moderation updated", audio });
  } catch (error) {
    console.error("Moderation error:", error);
    res.status(500).json({ message: "Failed to update moderation", error: error.message });
  }
};

// ✅ DELETE AUDIO (uploader or admin)
export const deleteAudio = async (req, res) => {
  try {
    const { id } = req.params;
    const audio = await Audio.findById(id);
    if (!audio) return res.status(404).json({ message: "Audio not found" });

    // Only uploader or admin can delete
    if (audio.uploader.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized to delete this audio" });
    }

    const filePath = audio.filePath ? path.resolve(audio.filePath) : null;
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await audio.deleteOne();
    res.status(200).json({ message: "Audio deleted successfully" });
  } catch (error) {
    console.error("❌ Delete audio error:", error);
    res.status(500).json({ message: "Failed to delete audio", error: error.message });
  }
};
