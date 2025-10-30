import express from "express";
import { addComment, toggleLike, getComments } from "../controllers/interactionController.js";

const router = express.Router();

router.post("/comment", addComment);
router.post("/like", toggleLike);
router.get("/comments/:targetType/:targetId", getComments);

export default router;
