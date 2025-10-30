import express from "express";
import { createNews, getAllNews, getNewsById } from "../controllers/newsController.js";

const router = express.Router();

router.post("/create", createNews);
router.get("/", getAllNews);
router.get("/:id", getNewsById);

export default router;
