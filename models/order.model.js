/**
 * @file order.model.js
 * @description Mongoose schema and model for customer orders.
 *
 * Sub-schemas (all with _id: false):
 *  - orderItemSchema       — a single line item (product ref + price snapshot)
 *  - shippingAddressSchema — delivery address
 *  - paymentInfoSchema     — payment method, status, and Razorpay IDs
 *
 * Price snapshot:
 *  title, thumbnail, and price are copied from the Product at order creation time.
 *  This ensures historical orders are unaffected by future product edits.
 *
 * Totals:
 *  grandTotal = itemsTotal + shippingCharge - discount
 *  All totals are computed server-side in the order controller.
 *
 * Indexes:
 *  - user   — for fast "my orders" queries
 *  - status — for admin filtering by order status
 */

import mongoose from "mongoose";

/**
 * A single product line item within an order.
 * Price, title, and thumbnail are snapshotted at order creation time.
 */
const orderItemSchema = new mongoose.Schema(
  {
    product:   { type: String, ref: "Product", required: true },
    /** Product title at time of order — immutable snapshot */
    title:     { type: String, required: true },
    /** Product thumbnail URL at time of order */
    thumbnail: { type: String },
    /** Unit price at time of order — immutable snapshot */
    price:     { type: Number, required: true },
    quantity:  { type: Number, required: true, min: 1 },
    /** price × quantity */
    subtotal:  { type: Number, required: true },
  },
  { _id: false }
);

/**
 * Delivery address provided by the customer at checkout.
 */
const shippingAddressSchema = new mongoose.Schema(
  {
    fullName:   { type: String, required: true },
    email:      { type: String, required: true },
    address:    { type: String, required: true },
  },
  { _id: false }
);

/**
 * Payment details for the order.
 * razorpayOrderId and razorpayPaymentId are populated by the payment service.
 */
const paymentInfoSchema = new mongoose.Schema(
  {
    method:              { type: String, enum: ["razorpay", "cod", "card"], required: true },
    status:              { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
    razorpayOrderId:     { type: String },
    razorpayPaymentId:   { type: String },
    /** Timestamp when payment was confirmed */
    paidAt:              { type: Date },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    /** Reference to the User who placed the order */
    user:            { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items:           { type: [orderItemSchema], required: true },
    shippingAddress: { type: shippingAddressSchema, required: true },
    payment:         { type: paymentInfoSchema, required: true },

    /** Sum of all item subtotals */
    itemsTotal:      { type: Number, required: true },
    shippingCharge:  { type: Number, default: 0 },
    discount:        { type: Number, default: 0 },
    /** itemsTotal + shippingCharge - discount */
    grandTotal:      { type: Number, required: true },

    /**
     * Order lifecycle status.
     * Transitions: pending → confirmed → processing → shipped → delivered
     * Or:          pending/confirmed → cancelled
     * Or:          delivered → refunded
     */
    status: {
      type:    String,
      enum:    ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"],
      default: "pending",
      index:   true,
    },

    /** Set automatically when status changes to "delivered" */
    deliveredAt:  { type: Date },
    /** Set automatically when status changes to "cancelled" */
    cancelledAt:  { type: Date },
    cancelReason: { type: String },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
