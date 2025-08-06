import express from "express";
import authRoutes from "./auth.routes.js";
import adminRoutes from "./adminRoutes.js";
import employeeRoutes from "./employeeRoutes.js";
import customerRoutes from "./customerRoutes.js";
import productRoutes from "./productRoutes.js";
import orderRoutes from "./orderRoutes.js";
import orderItemRoutes from "./orderItemRoutes.js";
import paymentRoutes from "./paymentRoutes.js";
import deliveryRoutes from "./deliveryRoutes.js";
import reportsRoutes from "./reportsRoutes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/admins", adminRoutes);
router.use("/employees", employeeRoutes);
router.use("/customers", customerRoutes);
router.use("/products", productRoutes);
router.use("/orders", orderRoutes);
router.use("/order-items", orderItemRoutes);
router.use("/payments", paymentRoutes);
router.use("/deliveries", deliveryRoutes);
router.use("/reports", reportsRoutes);

export default router;
