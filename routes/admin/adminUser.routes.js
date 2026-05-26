import express from "express";
import {
  getAllUsers,
  getUserById,
  updateUserById,
  deleteUserById,
} from "../../controllers/user/user.controller.js";
import verifyToken from "../../middlewares/verifyToken.middle.js";
import isAdmin from "../../middlewares/isAdmin.middleware.js";
import { updateLimiter, deleteLimiter } from "../../config/rateLimit.config.js";

const router = express.Router();

router.use(verifyToken, isAdmin);

router.get(   "/",    getAllUsers);
router.get(   "/:id", getUserById);
router.patch( "/:id", updateLimiter, updateUserById);
router.delete("/:id", deleteLimiter, deleteUserById);

export default router;
