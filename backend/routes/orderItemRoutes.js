import express from "express";
import {
  getAllOrderItems,
  getOrderItemById,
  createOrderItem,
  updateOrderItem,
  deleteOrderItem,
  getOrderItemsByOrderId,
} from "../controllers/orderItemController.js";
import {
  validate,
  validatePartial,
} from "../middlewares/validationMiddleware.js";
import { orderItemSchema } from "../validators/validator.js";
import {
  authenticateAdmin,
  restrictToAdmin,
} from "../middlewares/authmiddleware.js";

const router = express.Router();

// Admin/staff only
router.get(
  "/",
  authenticateAdmin,
  restrictToAdmin("admin", "staff"),
  getAllOrderItems
);
router.get(
  "/:id",
  authenticateAdmin,
  restrictToAdmin("admin", "staff"),
  getOrderItemById
);
router.post(
  "/",
  authenticateAdmin,
  restrictToAdmin("admin", "staff"),
  validate(orderItemSchema),
  createOrderItem
);
router.put(
  "/:id",
  authenticateAdmin,
  restrictToAdmin("admin", "staff"),
  validatePartial(orderItemSchema),
  updateOrderItem
);
router.delete(
  "/:id",
  authenticateAdmin,
  restrictToAdmin("admin", "staff"),
  deleteOrderItem
);

// Get all order items for a specific order
router.get(
  "/order/:order_id",
  authenticateAdmin,
  restrictToAdmin("admin", "staff"),
  getOrderItemsByOrderId
);

export default router;
 