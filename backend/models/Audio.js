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
      type: Number, // seconds
      default: 0,
    },

    // ✅ Engagement
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    plays: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },

    // ✅ Stream info
    streamUrl: {
      type: String,
      required: false,
    },
    liveStreamId: {
      type: String, // Links to a live broadcast session
      default: null,
    },
    replayAvailable: {
      type: Boolean, // If live stream replay is saved
      default: false,
    },

    // ✅ Sound Effects
    soundEffects: [
      {
        name: { type: String, trim: true },
        fileUrl: { type: String },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],

    // ✅ AI moderation & safety tracking
    moderation: {
      reviewed: { type: Boolean, default: false },
      status: {
        type: String,
        enum: ["pending", "approved", "flagged", "removed"],
        default: "pending",
      },
      reason: { type: String, default: "" },
    },

    // ✅ Discovery & personalization
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

    // ✅ Analytics
    analytics: {
      lastPlayedAt: { type: Date },
      totalListeningTime: { type: Number, default: 0 }, // seconds
      deviceTypes: {
        desktop: { type: Number, default: 0 },
        mobile: { type: Number, default: 0 },
        carMode: { type: Number, default: 0 },
      },
    },
  },
  { timestamps: true }
);

// 🧠 Indexing for search, discovery & AI recommendation
audioSchema.index({
  title: "text",
  artist: "text",
  genre: "text",
  moodTags: "text",
  language: "text",
});

const Audio = mongoose.model("Audio", audioSchema);
export default Audio;
