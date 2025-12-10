import express from "express";
import { register, login, logoutUser } from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Register and Login routes
router.post("/register", register);
router.post("/login", login);

// ✅ Logout route (protected)
router.post("/logout", verifyToken, logoutUser);

export default router;
