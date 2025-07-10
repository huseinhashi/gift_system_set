import express from "express";
import {
  loginAdmin,
  loginEmployee,
  registerCustomer,
  loginCustomer,
} from "../controllers/authController.js";

const router = express.Router();

// Admin login
router.post("/admin/login", loginAdmin);
// Employee login
router.post("/employee/login", loginEmployee);
// Customer registration
router.post("/customer/register", registerCustomer);
// Customer login
router.post("/customer/login", loginCustomer);

export default router;
