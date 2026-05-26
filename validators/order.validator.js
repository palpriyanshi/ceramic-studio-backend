import { z } from "zod";

const shippingAddressSchema = z.object({
  fullName: z.string({ required_error: "Full name is required" }).min(2).trim(),
  email:    z.string({ required_error: "Email is required" }).email("Invalid email").trim(),
  address:  z.string({ required_error: "Address is required" }).min(5).trim(),
});

const orderItemSchema = z.object({
  product: z.string({ required_error: "Product ID is required" }).min(2, "Product ID must be at least 2 characters"),
  quantity: z
    .number({ required_error: "Quantity is required", invalid_type_error: "Quantity must be a number" })
    .int()
    .min(1, "Quantity must be at least 1"),
});

export const createOrderSchema = z.object({
  items: z
    .array(orderItemSchema, { required_error: "Order items are required" })
    .min(1, "Order must have at least one item"),

  shippingAddress: shippingAddressSchema,

  paymentMethod: z.enum(["razorpay", "cod", "card"], {
    required_error: "Payment method is required",
    invalid_type_error: "Invalid payment method",
  }),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string({ required_error: "Razorpay order ID is required" }),
  razorpay_payment_id: z.string({ required_error: "Razorpay payment ID is required" }),
  razorpay_signature: z.string({ required_error: "Razorpay signature is required" }),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(
    ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"],
    { required_error: "Status is required", invalid_type_error: "Invalid status value" }
  ),
  cancelReason: z.string().trim().optional(),
});
