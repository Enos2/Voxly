import express from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/userModel.js";

dotenv.config();

const router = express.Router();

/* ──────────────────────────────────────────────
   🔑 Helper — Generate JWT Token
────────────────────────────────────────────── */
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

/* ──────────────────────────────────────────────
   📝 Register new user
────────────────────────────────────────────── */
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already in use" });

    const newUser = await User.create({ username, email, password });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        avatar: newUser.avatar,
      },
      token: generateToken(newUser._id),
    });
  } catch (error) {
    console.error("❌ Registration Error:", error.message);
    res.status(500).json({ message: "Server error during registration" });
  }
});

/* ──────────────────────────────────────────────
   🔐 Login user
────────────────────────────────────────────── */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ message: "User not found. Please register first." });

    const passwordMatch = await user.matchPassword(password);
    if (!passwordMatch)
      return res.status(401).json({ message: "Invalid email or password" });

    res.json({
      message: "Login successful",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        status: user.status,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("❌ Login Error:", error.message);
    res.status(500).json({ message: "Server error during login" });
  }
});

/* ──────────────────────────────────────────────
   🚫 Deactivate own account
────────────────────────────────────────────── */
router.put("/deactivate/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res.status(404).json({ message: "User not found" });

    user.status = "deactivated";
    await user.save();

    res.json({
      message: "Account deactivated successfully",
      user: { _id: user._id, username: user.username, status: user.status },
    });
  } catch (error) {
    console.error("❌ Deactivate Error:", error.message);
    res.status(500).json({ message: "Error deactivating account" });
  }
});

/* ──────────────────────────────────────────────
   ⚔️ Admin suspend or ban account
────────────────────────────────────────────── */
router.put("/admin/ban/:id", async (req, res) => {
  try {
    const { action } = req.body; // e.g., "suspended" or "banned"
    if (!["suspended", "banned"].includes(action))
      return res.status(400).json({ message: "Invalid action type" });

    const user = await User.findById(req.params.id);
    if (!user)
      return res.status(404).json({ message: "User not found" });

    user.status = action;
    await user.save();

    res.json({ message: `User ${action}`, user });
  } catch (error) {
    console.error("❌ Admin Ban Error:", error.message);
    res.status(500).json({ message: "Error updating user status" });
  }
});

/* ──────────────────────────────────────────────
   👤 Get profile by ID
────────────────────────────────────────────── */
router.get("/me/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user)
      return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (error) {
    console.error("❌ Fetch Profile Error:", error.message);
    res.status(500).json({ message: "Error fetching profile" });
  }
});

export default router;
