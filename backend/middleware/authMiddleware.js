import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/userModel.js";

dotenv.config();

/* ──────────────────────────────────────────────
 🔐 Verify JWT token and attach user data
────────────────────────────────────────────── */
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization token missing" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Fetch user and ensure they exist
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found or has been deleted" });
    }

    // ✅ Ensure active status (if applicable)
    if (user.status && user.status !== "active") {
      return res.status(403).json({ message: "Account is not active" });
    }

    // ✅ Attach a clean, minimal user object
    req.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role || "user",
    };

    next();
  } catch (error) {
    console.error("❌ Token verification failed:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token has expired. Please log in again." });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token." });
    }

    res.status(500).json({ message: "Authentication error", error: error.message });
  }
};

/* ──────────────────────────────────────────────
 🛡 Restrict route to Admins only
────────────────────────────────────────────── */
export const adminOnly = (req, res, next) => {
  if (req.user?.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied — Admins only." });
  }
};

/* ──────────────────────────────────────────────
 🎤 Restrict route to Artists only
────────────────────────────────────────────── */
export const artistOnly = (req, res, next) => {
  if (req.user?.role === "artist") {
    next();
  } else {
    res.status(403).json({ message: "Access denied — Artists only." });
  }
};
