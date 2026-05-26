import Razorpay from "razorpay";
import crypto from "crypto";

// Initialize Razorpay instance with keys from .env
const razorpay = new Razorpay({
  key_id: process.env.PAYMENT_API_KEY,
  key_secret: process.env.PAYMENT_API_SECRET,
});

/**
 * Create a new Razorpay order
 * @param {number} amount - Amount in smallest currency unit (paise for INR)
 * @param {string} currency - Currency code, default INR
 * @param {string} receipt - Unique receipt ID
 */
export const createOrder = async (amount, currency = "INR", receipt) => {
  const options = {
    amount: amount * 100, // convert to paise
    currency,
    receipt,
  };

  const order = await razorpay.orders.create(options);
  return order;
};

/**
 * Verify Razorpay payment signature
 * @param {string} razorpay_order_id
 * @param {string} razorpay_payment_id
 * @param {string} razorpay_signature
 */
export const verifyPayment = (razorpay_order_id, razorpay_payment_id, razorpay_signature) => {
  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.PAYMENT_API_SECRET)
    .update(body)
    .digest("hex");

  return expectedSignature === razorpay_signature;
};

/**
 * Fetch payment details by payment ID
 * @param {string} paymentId
 */
export const fetchPayment = async (paymentId) => {
  const payment = await razorpay.payments.fetch(paymentId);
  return payment;
};

export default razorpay;
