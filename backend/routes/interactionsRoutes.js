import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { addComment, toggleLike, getComments } from "../controllers/interactionController.js";

const router = express.Router();

// Protected
router.post("/comment", verifyToken, addComment);
router.post("/like", verifyToken, toggleLike);

// Public
router.get("/comments/:targetType/:targetId", getComments);

export default router;
