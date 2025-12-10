import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/userModel.js";
import TokenBlacklist from "../models/tokenBlacklistModel.js";

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

    // 🚫 Check blacklist
    const blacklisted = await TokenBlacklist.findOne({ token });
    if (blacklisted) {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }

    // 🔍 Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.status && user.status !== "active") {
      return res.status(403).json({ message: "Account is not active" });
    }

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
      return res.status(401).json({ message: "Token expired. Please log in again." });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token." });
    }

    res.status(500).json({ message: "Authentication error", error: error.message });
  }
};

/* ──────────────────────────────────────────────
 🛡 Role-based Access Control (RBAC)
────────────────────────────────────────────── */
export const allowRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "User not authenticated" });

  if (allowedRoles.includes(req.user.role)) next();
  else res.status(403).json({ message: `Access denied — ${allowedRoles.join(", ")} only.` });
};

// 🎯 Shortcut roles
export const adminOnly = allowRoles("admin");
export const artistOnly = allowRoles("artist");
export const supportOnly = allowRoles("support", "admin");

/* ──────────────────────────────────────────────
 🚪 Logout — Blacklist a Token
────────────────────────────────────────────── */
export const logoutUser = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(400).json({ message: "Token missing" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.decode(token);

    if (!decoded || !decoded.exp)
      return res.status(400).json({ message: "Invalid token" });

    const expiry = new Date(decoded.exp * 1000);
    await TokenBlacklist.create({ token, expiresAt: expiry });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("❌ Logout failed:", error.message);
    res.status(500).json({ message: "Logout error", error: error.message });
  }
};

/* ──────────────────────────────────────────────
 🔑 Backward compatibility aliases
────────────────────────────────────────────── */
export const protect = verifyToken;         // old import
export const authMiddleware = verifyToken;  // new import alias for consistency
