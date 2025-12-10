import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import TokenBlacklist from "../models/tokenBlacklistModel.js"; 
dotenv.config();

// 🔑 Generate JWT token
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// ───────────────────────────────
// 📝 Register new user
// ───────────────────────────────
export const register = async (req, res) => {
  try {
    const { name, username: rawUsername, email, password } = req.body;
    const username = rawUsername || name;

    if (!username || !email || !password)
      return res.status(400).json({ message: "All fields are required" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already in use" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
      token: generateToken(newUser._id),
    });
  } catch (error) {
    console.error("❌ Registration Error:", error.message);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// ───────────────────────────────
// 🔐 Login user
// ───────────────────────────────
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    res.json({
      message: "Login successful",
      token: generateToken(user._id),
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("❌ Login Error:", error.message);
    res.status(500).json({ message: "Server error during login" });
  }
};

// ───────────────────────────────
// 🚪 Logout user — blacklist token
// ───────────────────────────────
export const logoutUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer "))
      return res.status(400).json({ message: "Token missing" });

    const token = authHeader.split(" ")[1];

    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp)
      return res.status(400).json({ message: "Invalid token" });

    const expiry = new Date(decoded.exp * 1000);

    await TokenBlacklist.create({ token, expiresAt: expiry });

    res.status(200).json({ message: "User logged out successfully" });
  } catch (error) {
    console.error("❌ Logout Error:", error.message);
    res.status(500).json({ message: "Server error during logout" });
  }
};
