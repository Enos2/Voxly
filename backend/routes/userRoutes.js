// ✅ FILE: backend/routes/userRoutes.js
import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { registerUser, loginUser } from "../controllers/userController.js"; // ✅ New imports

const router = express.Router();

/* ──────────────────────────────────────────────
   🔐 Authentication Routes
────────────────────────────────────────────── */
router.post("/register", registerUser);
router.post("/login", loginUser);

/* ──────────────────────────────────────────────
   👤 Get Current User Profile (Protected)
────────────────────────────────────────────── */
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    console.error("❌ Error fetching profile:", error);
    res.status(500).json({ message: "Server error fetching profile" });
  }
});

/* ──────────────────────────────────────────────
   ✏️ Update Profile Info (username, avatar)
────────────────────────────────────────────── */
router.put("/update", verifyToken, async (req, res) => {
  const { username, avatar } = req.body;
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { username, avatar },
      { new: true }
    ).select("-password");

    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("❌ Error updating profile:", error);
    res.status(500).json({ message: "Error updating profile" });
  }
});

/* ──────────────────────────────────────────────
   ➕ Follow / ➖ Unfollow a User
────────────────────────────────────────────── */
router.put("/follow/:id", verifyToken, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!targetUser || !currentUser)
      return res.status(404).json({ message: "User not found" });

    if (targetUser._id.toString() === req.user.id)
      return res.status(400).json({ message: "You cannot follow yourself" });

    if (currentUser.following.includes(targetUser._id)) {
      // Already following — unfollow
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== targetUser._id.toString()
      );
      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== currentUser._id.toString()
      );
      await currentUser.save();
      await targetUser.save();
      return res.json({ message: "User unfollowed successfully" });
    } else {
      // Not following — follow
      currentUser.following.push(targetUser._id);
      targetUser.followers.push(currentUser._id);
      await currentUser.save();
      await targetUser.save();
      return res.json({ message: "User followed successfully" });
    }
  } catch (error) {
    console.error("❌ Error following user:", error);
    res.status(500).json({ message: "Error processing follow/unfollow" });
  }
});

/* ──────────────────────────────────────────────
   🚫 Block a User
────────────────────────────────────────────── */
router.put("/block/:id", verifyToken, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!targetUser || !currentUser)
      return res.status(404).json({ message: "User not found" });

    if (currentUser.blockedUsers.includes(targetUser._id)) {
      currentUser.blockedUsers = currentUser.blockedUsers.filter(
        (id) => id.toString() !== targetUser._id.toString()
      );
      await currentUser.save();
      return res.json({ message: "User unblocked successfully" });
    } else {
      currentUser.blockedUsers.push(targetUser._id);
      await currentUser.save();
      return res.json({ message: "User blocked successfully" });
    }
  } catch (error) {
    console.error("❌ Error blocking user:", error);
    res.status(500).json({ message: "Error blocking user" });
  }
});

/* ──────────────────────────────────────────────
   👥 Get All Users (For Discovery / Admin)
────────────────────────────────────────────── */
router.get("/all", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    console.error("❌ Error fetching all users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
});

/* ──────────────────────────────────────────────
   ⚔️ Admin: Suspend or Ban User
────────────────────────────────────────────── */
router.put("/admin/status/:id", verifyToken, async (req, res) => {
  try {
    const { action } = req.body; // e.g. "suspended" or "banned"

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { status: action },
      { new: true }
    ).select("-password");

    if (!updated)
      return res.status(404).json({ message: "User not found" });

    res.json({ message: `User ${action}`, user: updated });
  } catch (error) {
    console.error("❌ Error updating user status:", error);
    res.status(500).json({ message: "Error updating user status" });
  }
});

export default router;
