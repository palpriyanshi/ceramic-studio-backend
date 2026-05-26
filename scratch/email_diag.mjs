/**
 * Diagnostic: simulate what happens when the server calls sendWelcomeEmail
 * AFTER dotenv has loaded (which is the live server scenario).
 */
import dotenv from "dotenv";
dotenv.config({ path: "../env/.env" });

import { sendWelcomeEmail } from "../config/nodemailer.config.js";
import { sendOrderConfirmationEmail } from "../config/nodemailer.config.js";

const { SMTP_HOST, SMTP_USER } = process.env;
console.log("--- Env check ---");
console.log("SMTP_HOST:", SMTP_HOST);
console.log("SMTP_USER:", SMTP_USER);

// Test 1: sendWelcomeEmail
console.log("\n--- Testing sendWelcomeEmail ---");
try {
  await sendWelcomeEmail(SMTP_USER, "Test User");
  console.log("✅ sendWelcomeEmail succeeded");
} catch (err) {
  console.error("❌ sendWelcomeEmail threw:", err.message);
}

// Test 2: sendOrderConfirmationEmail with a mock order
console.log("\n--- Testing sendOrderConfirmationEmail ---");
const mockOrder = {
  _id: "507f1f77bcf86cd799439011",
  createdAt: new Date(),
  items: [
    { title: "Clay Mug", thumbnail: null, quantity: 2, subtotal: 1200 },
  ],
  itemsTotal: 1200,
  shippingCharge: 0,
  discount: 0,
  grandTotal: 1200,
  shippingAddress: {
    fullName: "Test Customer",
    email: SMTP_USER,
    address: "123 Test Street, Delhi",
  },
  payment: { method: "cod" },
};

try {
  await sendOrderConfirmationEmail(SMTP_USER, mockOrder);
  console.log("✅ sendOrderConfirmationEmail succeeded");
} catch (err) {
  console.error("❌ sendOrderConfirmationEmail threw:", err.message);
}
