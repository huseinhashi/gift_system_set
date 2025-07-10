import express from "express";
import {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  createOrderWithItems,
  getCustomerOrders,
  getCustomerOrderById,
  updateCustomerOrder,
} from "../controllers/orderController.js";
import {
  validate,
  validatePartial,
} from "../middlewares/validationMiddleware.js";
import { orderSchema } from "../validators/validator.js";
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
  getAllOrders
);
router.get(
  "/:id",
  authenticateAdmin,
  restrictToAdmin("admin", "staff"),
  getOrderById
);
router.post(
  "/",
  authenticateAdmin,
  restrictToAdmin("admin", "staff"),
  validate(orderSchema),
  createOrder
);
router.put(
  "/:id",
  authenticateAdmin,
  restrictToAdmin("admin", "staff"),
  validatePartial(orderSchema),
  updateOrder
);
router.delete(
  "/:id",
  authenticateAdmin,
  restrictToAdmin("admin", "staff"),
  deleteOrder
);

// Bulk create order with items (admin/staff only)
router.post(
  "/bulk",
  authenticateAdmin,
  restrictToAdmin("admin", "staff"),
  createOrderWithItems
);

// Customer routes
router.post("/customer/bulk", authenticateCustomer, createOrderWithItems);

// Customer order management
router.get("/customer/orders", authenticateCustomer, getCustomerOrders);
router.get("/customer/orders/:id", authenticateCustomer, getCustomerOrderById);
router.put("/customer/orders/:id", authenticateCustomer, updateCustomerOrder);

// Customer access to general order endpoints (with ownership checks)
router.get("/customer/:id", authenticateCustomer, getOrderById);
router.put(
  "/customer/:id",
  authenticateCustomer,
  validatePartial(orderSchema),
  updateOrder
);

export default router;
