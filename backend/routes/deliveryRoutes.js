import express from "express";
import {
  getAllDeliveries,
  getDeliveryById,
  createDelivery,
  updateDelivery,
  deleteDelivery,
  getEmployeeDeliveries,
  updateEmployeeDelivery,
} from "../controllers/deliveryController.js";
import {
  authenticateAdmin,
  restrictToAdmin,
  authenticateEmployee,
} from "../middlewares/authmiddleware.js";

const router = express.Router();

// Admin/staff only
router.get(
  "/",
  authenticateAdmin,
  restrictToAdmin("admin", "staff"),
  getAllDeliveries
);
router.get(
  "/:id",
  authenticateAdmin,
  restrictToAdmin("admin", "staff"),
  getDeliveryById
);
router.post(
  "/",
  authenticateAdmin,
  restrictToAdmin("admin", "staff"),
  createDelivery
);
router.put(
  "/:id",
  authenticateAdmin,
  restrictToAdmin("admin", "staff"),
  updateDelivery
);
router.delete(
  "/:id",
  authenticateAdmin,
  restrictToAdmin("admin", "staff"),
  deleteDelivery
);

// Employee: get all deliveries assigned to them
router.get(
  "/employee/my-deliveries",
  authenticateEmployee,
  getEmployeeDeliveries
);

// Employee: update their own delivery
router.put(
  "/employee/deliveries/:id",
  authenticateEmployee,
  updateEmployeeDelivery
);

export default router;
