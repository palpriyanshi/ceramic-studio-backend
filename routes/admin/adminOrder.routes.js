import express from "express";
import {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
} from "../../controllers/order/order.controller.js";
import verifyToken from "../../middlewares/verifyToken.middle.js";
import isAdmin from "../../middlewares/isAdmin.middleware.js";
import { updateLimiter, deleteLimiter } from "../../config/rateLimit.config.js";

const router = express.Router();

router.use(verifyToken, isAdmin);

router.get(   "/",           getAllOrders);
router.get(   "/:id",        getOrderById);
router.patch( "/:id/status", updateLimiter, updateOrderStatus);
router.delete("/:id",        deleteLimiter, deleteOrder);

export default router;
