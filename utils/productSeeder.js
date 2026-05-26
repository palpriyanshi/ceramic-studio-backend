/**
 * @file productSeeder.js
 * @description One-time script to seed the products collection from dummyjson.com.
 *
 * Run with:  npm run seed
 *
 * What it does:
 *  1. Connects to MongoDB using MONGO_URI from env/.env
 *  2. Fetches all 194 products from https://dummyjson.com/products
 *  3. Clears the existing products collection
 *  4. Maps the API response to the Product schema
 *  5. Bulk-inserts all products
 *  6. Disconnects from MongoDB
 *
 * Safe to re-run — clears existing products before inserting.
 */

import dotenv from "dotenv";
import axios from "axios";
import mongoose from "mongoose";
import Product from "../models/product.model.js";

dotenv.config({ path: "./env/.env" });

/** Fetches all products from dummyjson (limit=0 returns everything) */
const DUMMYJSON_URL = "https://dummyjson.com/products?limit=0";

/**
 * Fetches all products from the dummyjson API.
 * @returns {Promise<Object[]>} Raw product array from the API
 */
async function fetchAllProducts() {
  console.log("Fetching products from dummyjson...");
  const { data } = await axios.get(DUMMYJSON_URL);
  console.log(`Fetched ${data.products.length} products`);
  return data.products;
}

/**
 * Maps a raw dummyjson product object to the Product schema shape.
 * Handles optional fields with null fallbacks.
 *
 * @param {Object} p - Raw product from dummyjson API
 * @returns {Object} Mapped product ready for MongoDB insertion
 */
function mapProduct(p) {
  return {
    dummyId:              p.id,
    title:                p.title,
    description:          p.description,
    category:             p.category,
    price:                p.price,
    discountPercentage:   p.discountPercentage,
    rating:               p.rating,
    stock:                p.stock,
    tags:                 p.tags ?? [],
    brand:                p.brand ?? null,
    sku:                  p.sku ?? null,
    weight:               p.weight ?? null,
    dimensions:           p.dimensions ?? null,
    warrantyInformation:  p.warrantyInformation ?? null,
    shippingInformation:  p.shippingInformation ?? null,
    availabilityStatus:   p.availabilityStatus ?? null,
    reviews: (p.reviews ?? []).map((r) => ({
      rating:        r.rating,
      comment:       r.comment,
      date:          r.date ? new Date(r.date) : null,
      reviewerName:  r.reviewerName,
      reviewerEmail: r.reviewerEmail,
    })),
    returnPolicy:         p.returnPolicy ?? null,
    minimumOrderQuantity: p.minimumOrderQuantity ?? 1,
    meta: p.meta ? {
      createdAt: p.meta.createdAt ? new Date(p.meta.createdAt) : null,
      updatedAt: p.meta.updatedAt ? new Date(p.meta.updatedAt) : null,
      barcode:   p.meta.barcode ?? null,
      qrCode:    p.meta.qrCode ?? null,
    } : null,
    images:    p.images ?? [],
    thumbnail: p.thumbnail ?? null,
  };
}

/**
 * Main seeder function.
 * Connects to DB, clears products, fetches and inserts fresh data, then disconnects.
 * @returns {Promise<void>}
 */
async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const products = await fetchAllProducts();
    const mapped   = products.map(mapProduct);

    const deleted = await Product.deleteMany({});
    console.log(`Cleared ${deleted.deletedCount} existing products`);

    const inserted = await Product.insertMany(mapped, { ordered: false });
    console.log(`Seeded ${inserted.length} products successfully`);
  } catch (err) {
    console.error("Seeder failed:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

seed();
