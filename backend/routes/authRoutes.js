import express from "express";
import { register, login } from "../controllers/authController.js";

const router = express.Router();

// Register and login routes (now fully connected to controller)
router.post("/register", register);
router.post("/login", login);

export default router;
