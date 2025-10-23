import mongoose from "mongoose";

const audioSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    artist: { type: String, required: true },
    filePath: { type: String, required: true },
    uploader: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    coverImage: { type: String }, // optional
  },
  { timestamps: true }
);

export default mongoose.model("Audio", audioSchema);
