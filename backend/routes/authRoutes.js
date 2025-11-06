import express from "express";
import { register, login, logout } from "../controllers/authController.js";
import { verifyToken } from "../middleware/verifyToken.js"; // only if you already have this middleware

const router = express.Router();

// Register and login routes
router.post("/register", register);
router.post("/login", login);

// Logout route (protected so only logged-in users can call it)
router.post("/logout", verifyToken, logout);

export default router;
