import express from "express";
import {
  createOrder,
  getMyOrders,
  getMyOrderById,
  cancelMyOrder,
} from "../controllers/order/order.controller.js";
import verifyToken from "../middlewares/verifyToken.middle.js";
import { createLimiter } from "../config/rateLimit.config.js";

const router = express.Router();

router.post("/",               verifyToken, createLimiter, createOrder);
router.get( "/my",             verifyToken, getMyOrders);
router.get( "/my/:id",         verifyToken, getMyOrderById);
router.patch("/my/:id/cancel", verifyToken, cancelMyOrder);

export default router;
