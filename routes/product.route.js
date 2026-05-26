import express from "express";
import {
  getAllProducts,
  getProductById,
  getCategories,
} from "../controllers/product/product.controller.js";
import { cache } from "../middlewares/cache.middleware.js";

const router = express.Router();

router.get("/categories", cache(600), getCategories);
router.get("/",           cache(300), getAllProducts);
router.get("/:id",        cache(300), getProductById);

export default router;
