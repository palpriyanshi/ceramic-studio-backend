import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

dotenv.config({ path: "./env/.env" });

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connectDB = async (attempt = 1) => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed: ${error.message}`);
    if (attempt >= MAX_RETRIES) {
      console.error("Max retries reached. Exiting...");
      process.exit(1);
    }
    console.log(`Retrying in ${RETRY_DELAY_MS / 1000}s...`);
    await wait(RETRY_DELAY_MS);
    return connectDB(attempt + 1);
  }
};

export default connectDB;
