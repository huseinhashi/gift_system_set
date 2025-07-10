import express from "express";
import customerRoutes from "./customerRoutes.js";
import productRoutes from "./productRoutes.js";
import orderRoutes from "./orderRoutes.js";
import orderItemRoutes from "./orderItemRoutes.js";
import paymentRoutes from "./paymentRoutes.js";
import adminRoutes from "./adminRoutes.js";
import employeeRoutes from "./employeeRoutes.js";
import deliveryRoutes from "./deliveryRoutes.js";
// import reviewRoutes from "./reviewRoutes.js";
import authRoutes from "./auth.routes.js";

const router = express.Router();

// Authentication routes
router.use("/auth", authRoutes);

// Resource routes
router.use("/customers", customerRoutes);
router.use("/admins", adminRoutes);
router.use("/employees", employeeRoutes);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);
router.use("/order-items", orderItemRoutes);
router.use("/payments", paymentRoutes);
router.use("/deliveries", deliveryRoutes);
// router.use("/reviews", reviewRoutes);

export default router;
