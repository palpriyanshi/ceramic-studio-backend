import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "../models/product.model.js";

dotenv.config({ path: "./env/.env" });

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    const product = await Product.findByIdAndUpdate(
      "p1",
      { $set: { name: "Rustic Speckled Mug Updated", price: 26.00 } },
      { new: true, runValidators: true }
    );
    console.log("Updated Product successfully:", product);
  } catch (err) {
    console.error("Update failed with error:", err.message);
    if (err.errors) {
      console.error("Validation errors details:", err.errors);
    }
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected");
  }
}

run();
