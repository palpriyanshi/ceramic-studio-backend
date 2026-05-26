import express from "express";
import register from "../controllers/auth/register.controller.js";
import login from "../controllers/auth/login.controller.js";
import { loginLimiter, registerLimiter } from "../config/rateLimit.config.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = express.Router();

// upload.single("avatar") parses multipart/form-data and makes req.body available.
// When no file is sent the field is simply undefined — the controller handles that gracefully.
router.post("/register", registerLimiter, upload.single("avatar"), register);
router.post("/login",    loginLimiter,    login);

export default router;
