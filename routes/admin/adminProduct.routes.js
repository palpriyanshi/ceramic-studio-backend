import express from "express";
import {
  createProduct,
  updateProduct,
  patchProduct,
  deleteProduct,
  bulkDeleteProducts,
} from "../../controllers/product/product.controller.js";
import verifyToken from "../../middlewares/verifyToken.middle.js";
import isAdmin from "../../middlewares/isAdmin.middleware.js";
import { createLimiter, updateLimiter, deleteLimiter } from "../../config/rateLimit.config.js";

const router = express.Router();

router.use(verifyToken, isAdmin);

router.post(  "/",             createLimiter, createProduct);
router.delete("/bulk-delete",  deleteLimiter, bulkDeleteProducts);
router.put(   "/:id",          updateLimiter, updateProduct);
router.patch( "/:id",          updateLimiter, patchProduct);
router.delete("/:id",          deleteLimiter, deleteProduct);

export default router;
