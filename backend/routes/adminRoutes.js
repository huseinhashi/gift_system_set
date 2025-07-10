import express from "express";
import {
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  deleteAdmin,
} from "../controllers/adminController.js";
import {
  validate,
  validatePartial,
} from "../middlewares/validationMiddleware.js";
import { adminSchema } from "../validators/validator.js";
import {
  authenticateAdmin,
  restrictToAdmin,
} from "../middlewares/authmiddleware.js";

const router = express.Router();

// Admin only (super-admin)
router.get(
  "/",
  authenticateAdmin,
  restrictToAdmin("admin", "staff"),
  getAllAdmins
);
router.get("/:id", authenticateAdmin, restrictToAdmin("admin"), getAdminById);
router.post(
  "/",
  authenticateAdmin,
  restrictToAdmin("admin"),
  validate(adminSchema),
  createAdmin
);
router.put(
  "/:id",
  authenticateAdmin,
  restrictToAdmin("admin"),
  validatePartial(adminSchema),
  updateAdmin
);
router.delete("/:id", authenticateAdmin, restrictToAdmin("admin"), deleteAdmin);

export default router;
