import Comment from "../models/commentModel.js";
import Like from "../models/likeModel.js";

/* ───────────────────────────────
   💬 Create Comment
─────────────────────────────── */
export const addComment = async (req, res) => {
  try {
    const { content, targetType, targetId, author } = req.body;
    if (!content || !targetType || !targetId || !author) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const comment = await Comment.create({ content, targetType, targetId, author });
    res.status(201).json({ message: "Comment added", comment });
  } catch (error) {
    console.error("❌ Comment Error:", error);
    res.status(500).json({ message: "Server error adding comment" });
  }
};

/* ───────────────────────────────
   👍 Like or Dislike
─────────────────────────────── */
export const toggleLike = async (req, res) => {
  try {
    const { user, targetType, targetId, type } = req.body;
    const existing = await Like.findOne({ user, targetType, targetId });

    if (existing) {
      if (existing.type === type) {
        await existing.deleteOne();
        return res.json({ message: `${type} removed` });
      } else {
        existing.type = type;
        await existing.save();
        return res.json({ message: `Changed to ${type}` });
      }
    }

    const like = await Like.create({ user, targetType, targetId, type });
    res.status(201).json({ message: `${type} added`, like });
  } catch (error) {
    console.error("❌ Like Error:", error);
    res.status(500).json({ message: "Server error updating like" });
  }
};

/* ───────────────────────────────
   📋 Get comments for target
─────────────────────────────── */
export const getComments = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;
    const comments = await Comment.find({ targetType, targetId })
      .populate("author", "username avatar")
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    console.error("❌ Fetch Comments Error:", error);
    res.status(500).json({ message: "Error fetching comments" });
  }
};
