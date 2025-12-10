import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { createNews, getAllNews, getNewsById } from "../controllers/newsController.js";

const router = express.Router();

// Public
router.get("/", getAllNews);
router.get("/id/:id", getNewsById); // avoid conflict with /create

// Private
router.post("/create", verifyToken, createNews);

export default router;
