import mongoose from "mongoose";

const audioSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    artist: {
      type: String,
      required: true,
      trim: true,
    },
    uploader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
      default: "https://cdn-icons-png.flaticon.com/512/727/727245.png",
    },
    genre: {
      type: String,
      trim: true,
      default: "General",
    },
    duration: {
      type: Number, // in seconds
      default: 0,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    plays: {
      type: Number,
      default: 0,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    streamUrl: {
      type: String, // auto-generated URL for playback
      required: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    moodTags: [
      {
        type: String,
        trim: true,
      },
    ],
    language: {
      type: String,
      trim: true,
      default: "English",
    },
  },
  { timestamps: true }
);

// 🧠 Indexing for fast discovery & shuffle algorithms
audioSchema.index({ title: "text", artist: "text", genre: "text", moodTags: "text" });

const Audio = mongoose.model("Audio", audioSchema);
export default Audio;
