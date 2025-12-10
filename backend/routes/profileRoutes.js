import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import Profile from "../models/Profile.js";

const router = express.Router();

/* ──────────────────────────────────────────────
   ✏️ Create or Update User Profile
────────────────────────────────────────────── */
router.post("/update", verifyToken, async (req, res) => {
  try {
    const { bio, avatar, role } = req.body;

    let profile = await Profile.findOne({ user: req.user.id });

    if (profile) {
      profile.bio = bio || profile.bio;
      profile.avatar = avatar || profile.avatar;
      profile.role = role || profile.role;
      await profile.save();
      return res.json({ message: "Profile updated", profile });
    }

    profile = await Profile.create({
      user: req.user.id,
      bio,
      avatar,
      role,
    });

    res.status(201).json({ message: "Profile created", profile });
  } catch (error) {
    console.error("❌ Profile update/create error:", error);
    res.status(500).json({ message: error.message });
  }
});

/* ──────────────────────────────────────────────
   👤 Get Profile by User ID
────────────────────────────────────────────── */
router.get("/:id", async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.id }).populate(
      "user",
      "username email"
    );
    if (!profile) return res.status(404).json({ message: "Profile not found" });

    res.json(profile);
  } catch (error) {
    console.error("❌ Fetch profile error:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
