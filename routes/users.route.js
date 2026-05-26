import express from "express";
import {
  getMe,
  updateMe,
  updateAvatar,
  changePassword,
  deleteMe,
} from "../controllers/user/user.controller.js";
import verifyToken from "../middlewares/verifyToken.middle.js";
import { upload } from "../middlewares/multer.middleware.js";
import { updateLimiter, deleteLimiter } from "../config/rateLimit.config.js";

const router = express.Router();

router.get(   "/me",                 verifyToken, getMe);
router.patch( "/me",                 verifyToken, updateLimiter, updateMe);
router.delete("/me",                 verifyToken, deleteLimiter, deleteMe);
router.patch( "/me/avatar",          verifyToken, upload.single("avatar"), updateAvatar);
router.patch( "/me/change-password", verifyToken, changePassword);

export default router;
