import express from "express";
import {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../controllers/employeeController.js";
import {
  validate,
  validatePartial,
} from "../middlewares/validationMiddleware.js";
import { employeeSchema } from "../validators/validator.js";
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
  getAllEmployees
);
router.get(
  "/:id",
  authenticateAdmin,
  restrictToAdmin("admin", "staff"),
  getEmployeeById
);
router.post(
  "/",
  authenticateAdmin,
  restrictToAdmin("admin", "staff"),
  validate(employeeSchema),
  createEmployee
);
router.put(
  "/:id",
  authenticateAdmin,
  restrictToAdmin("admin", "staff"),
  validatePartial(employeeSchema),
  updateEmployee
);
router.delete(
  "/:id",
  authenticateAdmin,
  restrictToAdmin("admin", "staff"),
  deleteEmployee
);

export default router;
