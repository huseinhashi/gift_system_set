import express from "express";
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerController.js";
import {
  validate,
  validatePartial,
} from "../middlewares/validationMiddleware.js";
import { customerSchema } from "../validators/validator.js";
import {
  authenticateAdmin,
  restrictToAdmin,
} from "../middlewares/authmiddleware.js";

const router = express.Router();

// Public registration
router.post("/register", validate(customerSchema), createCustomer);

// Admin only
router.get(
  "/",
  authenticateAdmin,
  restrictToAdmin("admin", "staff"),
  getAllCustomers
);
router.get(
  "/:id",
  authenticateAdmin,
  restrictToAdmin("admin", "staff"),
  getCustomerById
);
router.put(
  "/:id",
  authenticateAdmin,
  restrictToAdmin("admin", "staff"),
  validatePartial(customerSchema),
  updateCustomer
);
router.delete(
  "/:id",
  authenticateAdmin,
  restrictToAdmin("admin", "staff"),
  deleteCustomer
);

export default router;
