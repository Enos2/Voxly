import express from "express";
import Profile from "../models/Profile.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create or update user profile
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
    } else {
      profile = await Profile.create({
        user: req.user.id,
        bio,
        avatar,
        role,
      });
      res.status(201).json({ message: "Profile created", profile });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get profile by user ID
router.get("/:id", async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.id }).populate("user", "name email");
    if (!profile) return res.status(404).json({ message: "Profile not found" });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
