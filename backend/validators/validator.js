import { z } from "zod";

// Admin Schema
export const adminSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  wallet_address: z.string().min(42).max(42),
  role: z.enum(["admin", "staff"]).default("staff"),
  is_active: z.boolean().optional(),
});

// Employee Schema
export const employeeSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  password_hash: z.string().min(6).max(100),
  is_active: z.boolean().optional(),
});

// Customer Schema
export const customerSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().optional(),
  address: z.string().optional(),
  password_hash: z.string().min(6).max(100),
  is_active: z.boolean().optional(),
});

// Product Schema
export const productSchema = z.object({
  name: z.string().min(2).max(150),
  description: z.string().optional(),
  category: z.enum([
    "flower_bouquet",
    "gift_box",
    "chocolates",
    "balloons",
    "greeting_card",
    "combo_pack",
    "plants",
    "custom",
  ]),
  price: z.preprocess(
    (v) => (typeof v === "string" ? Number(v) : v),
    z.number().min(0)
  ),
  stock_quantity: z.preprocess(
    (v) => (typeof v === "string" ? Number(v) : v),
    z.number().int().min(0).optional()
  ),
  image_url: z.string().optional(),
  is_active: z.preprocess((v) => {
    if (typeof v === "string") return v === "true";
    return v;
  }, z.boolean().optional()),
});

// Order Schema
export const orderSchema = z.object({
  customer_id: z.number().int(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
});

// Order Item Schema
export const orderItemSchema = z.object({
  product_id: z.number().int(),
  quantity: z.number().int().min(1),
});

// Payment Schema
export const paymentSchema = z.object({
  order_id: z.number().int(),
  payment_type: z.enum(["api", "cash"]).optional(),
  transaction_id: z.string().optional(),
  amount: z.preprocess(
    (v) => (typeof v === "string" ? Number(v) : v),
    z.number().min(0)
  ),
});

// Delivery Schema
export const deliverySchema = z.object({
  order_id: z.number().int(),
  assigned_to: z.number().int(),
  delivery_status: z
    .enum(["pending", "in_transit", "delivered", "failed", "returned"])
    .default("pending"),
  delivery_notes: z.string().optional(),
  scheduled_date: z.string().optional(), // ISO date
  delivered_at: z.string().optional(), // ISO date
});

// Review Schema
export const reviewSchema = z.object({
  customer_id: z.number().int(),
  product_id: z.number().int(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

// Login Schema (for all user types)
export const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(6).max(100),
});
