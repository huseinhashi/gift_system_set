import express from "express";
import {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentsByOrder,
  processPayment,
} from "../controllers/paymentController.js";
import {
  validate,
  validatePartial,
} from "../middlewares/validationMiddleware.js";
import { paymentSchema } from "../validators/validator.js";
import {
  authenticateAdmin,
  restrictToAdmin,
  authenticateCustomer,
} from "../middlewares/authmiddleware.js";

const router = express.Router();

// Admin/staff only
router.get(
  "/",
  authenticateAdmin,
  restrictToAdmin("admin", "staff"),
  getAllPayments
);
router.get(
  "/:id",
  authenticateAdmin,
  restrictToAdmin("admin", "staff"),
  getPaymentById
);
router.get(
  "/order/:orderId",
  authenticateAdmin,
  restrictToAdmin("admin", "staff"),
  getPaymentsByOrder
);
router.post(
  "/",
  authenticateAdmin,
  restrictToAdmin("admin", "staff"),
  validate(paymentSchema),
  createPayment
);
router.put(
  "/:id",
  authenticateAdmin,
  restrictToAdmin("admin", "staff"),
  validatePartial(paymentSchema),
  updatePayment
);
router.delete(
  "/:id",
  authenticateAdmin,
  restrictToAdmin("admin", "staff"),
  deletePayment
);

// Process payment (customer only)
router.post("/process", authenticateCustomer, processPayment);

export default router;
