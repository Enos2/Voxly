import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// 🔑 Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// 📝 Register new user
router.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already in use" });

    const newUser = await User.create({ username, email, password });
    res.status(201).json({
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      token: generateToken(newUser._id),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during registration" });
  }
});

// 🔐 Login user
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error during login" });
  }
});

// 🚫 Deactivate account (user side)
router.put("/deactivate/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: "deactivated" },
      { new: true }
    );
    res.json({ message: "Account deactivated", user });
  } catch (error) {
    res.status(500).json({ message: "Error deactivating account" });
  }
});

// ⚔️ Admin suspend or ban account
router.put("/admin/ban/:id", async (req, res) => {
  try {
    const { action } = req.body; // "suspend" or "banned"
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: action },
      { new: true }
    );
    res.json({ message: `User ${action}`, user });
  } catch (error) {
    res.status(500).json({ message: "Error updating user status" });
  }
});

// 👤 Get profile
router.get("/me/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile" });
  }
});

export default router;
