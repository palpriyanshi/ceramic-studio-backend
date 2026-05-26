/**
 * @file product.controller.js
 * @description All product controllers — public reads and admin CRUD.
 *
 * Public (no auth):
 *  - getAllProducts, getCategories, getProductById
 *
 * Admin (verifyToken + isAdmin):
 *  - createProduct, updateProduct, patchProduct, deleteProduct, bulkDeleteProducts
 */

import Product from "../../models/product.model.js";
import asyncHandler from "../../utils/asyncHandler.utils.js";
import ApiError from "../../utils/errorHandler.utils.js";
import { invalidateCache } from "../../middlewares/cache.middleware.js";
import { getPaginationParams, paginate } from "../../utils/pagination.utils.js";

const PRODUCT_CACHE_PATTERN = "cache:/api/v1/products*";

// ─── PUBLIC ──────────────────────────────────────────────────────────────────

export const getAllProducts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req);
  const { category, search } = req.query;

  const filter = {};
  if (category) filter.category = category;
  if (search)   filter.name = { $regex: search, $options: "i" };

  const [products, total] = await Promise.all([
    Product.find(filter).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);

  res.status(200).json(paginate(products, total, page, limit, "products"));
});

export const getCategories = asyncHandler(async (_req, res) => {
  const categories = await Product.distinct("category");
  res.status(200).json(categories);
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).lean();
  if (!product) throw new ApiError(404, "Product not found");
  res.status(200).json(product);
});

// ─── ADMIN ────────────────────────────────────────────────────────────────────

export const createProduct = asyncHandler(async (req, res) => {
  const { name, price } = req.body;
  if (!name || price === undefined) throw new ApiError(400, "name and price are required");

  const product = await Product.create(req.body);
  await invalidateCache(PRODUCT_CACHE_PATTERN);
  res.status(201).json(product);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id, { $set: req.body }, { new: true, runValidators: true }
  );
  if (!product) throw new ApiError(404, "Product not found");
  await invalidateCache(PRODUCT_CACHE_PATTERN);
  res.status(200).json(product);
});

export const patchProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id, { $set: req.body }, { new: true, runValidators: true }
  );
  if (!product) throw new ApiError(404, "Product not found");
  await invalidateCache(PRODUCT_CACHE_PATTERN);
  res.status(200).json(product);
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");
  await invalidateCache(PRODUCT_CACHE_PATTERN);
  res.status(200).json({ message: "Product deleted successfully" });
});

export const bulkDeleteProducts = asyncHandler(async (req, res) => {
  const { ids, category } = req.body;
  if (!ids?.length && !category) throw new ApiError(400, "Provide ids[] or category to bulk delete");

  const filter = {};
  if (ids?.length) filter._id = { $in: ids };
  if (category)    filter.category = category;

  const result = await Product.deleteMany(filter);
  await invalidateCache(PRODUCT_CACHE_PATTERN);
  res.status(200).json({ message: `${result.deletedCount} product(s) deleted` });
});
