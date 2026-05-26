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
import { upload } from "../../middlewares/multer.middleware.js";
import uploadOnCloudinary from "../../utils/cloudinary.utils.js";
import asyncHandler from "../../utils/asyncHandler.utils.js";
import ApiError from "../../utils/errorHandler.utils.js";

const router = express.Router();

router.use(verifyToken, isAdmin);

router.post("/upload", createLimiter, upload.single("image"), asyncHandler(async (req, res) => {
  const localPath = req.file?.path;
  if (!localPath) throw new ApiError(400, "No image file provided");
  const uploaded = await uploadOnCloudinary(localPath);
  if (!uploaded) throw new ApiError(500, "Image upload failed");
  res.status(200).json({ secure_url: uploaded.secure_url });
}));

router.post(  "/",             createLimiter, createProduct);
router.delete("/bulk-delete",  deleteLimiter, bulkDeleteProducts);
router.put(   "/:id",          updateLimiter, updateProduct);
router.patch( "/:id",          updateLimiter, patchProduct);
router.delete("/:id",          deleteLimiter, deleteProduct);

export default router;
