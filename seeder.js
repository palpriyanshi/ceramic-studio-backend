import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "./models/product.model.js";
import User from "./models/user.model.js";
import { hashPassword } from "./utils/password.utils.js";
import { products } from "../ceramic-frontend/src/data/productsData.js";

dotenv.config({ path: "./env/.env" });

async function seed() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not defined in env/.env");
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB successfully");

    // 1. Seed Products
    console.log("Dropping existing products collection to reset indexes...");
    await Product.collection.drop().catch(() => {});

    console.log("Mapping and seeding products from frontend data...");
    const mappedProducts = products.map((p) => ({
      _id:         p.id,
      name:        p.name,
      price:       p.price,
      salePrice:   p.salePrice || null,
      category:    p.category,
      image:       p.image,
      hoverImage:  p.hoverImage || null,
      description: p.description || "",
      details:     p.details || null,
      inStock:     p.inStock !== undefined ? p.inStock : true,
    }));

    const seededProducts = await Product.insertMany(mappedProducts);
    console.log(`Successfully seeded ${seededProducts.length} products`);

    // 2. Seed Default Users
    console.log("Clearing existing users...");
    await User.deleteMany({});

    console.log("Seeding default user member@ceramic.studio...");
    const hashedPassword = await hashPassword("password123");
    const testUser = await User.create({
      name: "Studio Member",
      email: "member@ceramic.studio",
      password: hashedPassword,
      role: "user",
    });
    console.log(`Successfully seeded user: ${testUser.name} (${testUser.email})`);

    console.log("Seeding admin user admin@ceramic.studio...");
    const hashedAdminPassword = await hashPassword("admin123");
    const adminUser = await User.create({
      name: "Studio Admin",
      email: "admin@ceramic.studio",
      password: hashedAdminPassword,
      role: "admin",
    });
    console.log(`Successfully seeded admin: ${adminUser.name} (${adminUser.email})`);

  } catch (error) {
    console.error("Seeder failed:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

seed();
