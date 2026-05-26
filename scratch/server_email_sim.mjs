/**
 * Simulates exactly what the running server does when sending emails.
 * Run from: ceramic-backend directory
 * Usage: node scratch/server_email_sim.mjs
 */
import dotenv from "dotenv";

// Exactly as index.js does it
const result = dotenv.config({ path: "./env/.env" });
console.log("dotenv loaded:", result.error ? "ERROR: " + result.error.message : "OK");

import nodemailer from "nodemailer";

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_NAME } = process.env;

console.log("\n=== Env vars (as seen by running server) ===");
console.log("SMTP_HOST :", SMTP_HOST  ?? "❌ undefined");
console.log("SMTP_PORT :", SMTP_PORT  ?? "❌ undefined");
console.log("SMTP_USER :", SMTP_USER  ?? "❌ undefined");
console.log("SMTP_PASS :", SMTP_PASS ? `✅ set (${SMTP_PASS.length} chars, starts: ${SMTP_PASS.slice(0,4)}...)` : "❌ undefined");
console.log("FROM_NAME :", FROM_NAME  ?? "❌ undefined");

if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
  console.error("\n❌ SMTP env vars are missing — this is the bug!");
  process.exit(1);
}

console.log("\n=== Creating transporter ===");
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT) || 587,
  secure: Number(SMTP_PORT) === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

console.log("=== Verifying SMTP connection ===");
try {
  await transporter.verify();
  console.log("✅ SMTP verify passed");
} catch (err) {
  console.error("❌ SMTP verify failed:", err.message);
  console.error("   code    :", err.code);
  console.error("   response:", err.response);
  process.exit(1);
}

console.log("\n=== Sending welcome email test ===");
try {
  const info = await transporter.sendMail({
    from: `"${FROM_NAME || "Ceramic Studio"}" <${SMTP_USER}>`,
    to: SMTP_USER,
    subject: "🧪 Welcome Email Test — Ceramic Studio Server Sim",
    html: `<h2>Welcome email simulation</h2><p>Sent at ${new Date().toISOString()}</p>`,
  });
  console.log("✅ Welcome email sent! MessageId:", info.messageId);
  console.log("   Accepted:", info.accepted);
} catch (err) {
  console.error("❌ sendMail failed:", err.message);
  console.error("   code    :", err.code);
  console.error("   response:", err.response);
}
