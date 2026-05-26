import app from "./src/app.js";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.config.js";
import cloudinaryConfig from "./config/cloudinary.config.js";
import { connectRedis } from "./config/redis.config.js";

dotenv.config({ path: "./env/.env" });

cloudinaryConfig();
connectDB();
connectRedis();

app.use(cors());
app.listen(process.env.PORT, () => {
  const base = `http://localhost:${process.env.PORT}`;
  console.log(`Server   : ${base}`);
  console.log(`API Docs : ${base}/api-docs`);
});
