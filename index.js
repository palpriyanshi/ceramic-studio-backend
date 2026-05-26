import app from "./src/app.js";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.config.js";
import cloudinaryConfig from "./config/cloudinary.config.js";
import { connectRedis } from "./config/redis.config.js";
import nodemailer from "nodemailer";

dotenv.config({ path: "./env/.env" });

cloudinaryConfig();
connectDB();
connectRedis();

// ── SMTP startup check ──────────────────────────────────────────────────────
(async () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn("⚠️  SMTP not configured — email delivery is disabled.");
    console.warn(`   SMTP_HOST: ${SMTP_HOST || "❌ not set"}`);
    console.warn(`   SMTP_USER: ${SMTP_USER || "❌ not set"}`);
    console.warn(`   SMTP_PASS: ${SMTP_PASS ? "✅ set" : "❌ not set"}`);
    return;
  }
  try {
    const t = nodemailer.createTransport({
      host: SMTP_HOST, port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    await t.verify();
    console.log(`✅ SMTP ready   : ${SMTP_USER} @ ${SMTP_HOST}:${SMTP_PORT || 587}`);
  } catch (err) {
    console.error(`❌ SMTP failed  : ${err.message} (code: ${err.code || "N/A"})`);
    console.error(`   Check SMTP_PASS in env/.env — Gmail app password may need regeneration.`);
  }
})();

app.use(cors());
app.listen(process.env.PORT, () => {
  const base = `http://localhost:${process.env.PORT}`;
  console.log(`Server   : ${base}`);
  console.log(`API Docs : ${base}/api-docs`);
});
