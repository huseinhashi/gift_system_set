import { Admin, Employee, Customer } from "../models/index.js";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";
import {
  adminSchema,
  employeeSchema,
  customerSchema,
  loginSchema,
} from "../validators/validator.js";

// Generate JWT token
const generateToken = (user, type, role) => {
  return jwt.sign(
    {
      id: user.admin_id || user.employee_id || user.customer_id,
      role: role || user.role,
      type,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Admin login
export const loginAdmin = async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const admin = await Admin.findOne({
      where: { email: validatedData.email },
    });
    if (!admin || !(await admin.validPassword(validatedData.password))) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }
    if (!admin.is_active) {
      return res
        .status(403)
        .json({ success: false, message: "Account is inactive" });
    }
    const token = generateToken(admin, "admin", admin.role);
    res.json({ success: true, data: { admin, token } });
  } catch (error) {
    next(error);
  }
};

// Employee login
export const loginEmployee = async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const employee = await Employee.findOne({
      where: { phone: validatedData.phone },
    });
    if (!employee || !(await employee.validPassword(validatedData.password))) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }
    if (!employee.is_active) {
      return res
        .status(403)
        .json({ success: false, message: "Account is inactive" });
    }
    const token = generateToken(employee, "employee");
    res.json({ success: true, data: { employee, token } });
  } catch (error) {
    next(error);
  }
};

// Customer registration
export const registerCustomer = async (req, res, next) => {
  try {
    const validatedData = customerSchema.parse(req.body);
    // Check if phone already exists
    const existing = await Customer.findOne({
      where: { phone: validatedData.phone },
    });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Phone already in use" });
    }
    const customer = await Customer.create(validatedData);
    const token = generateToken(customer, "customer");
    res.status(201).json({ success: true, data: { customer, token } });
  } catch (error) {
    next(error);
  }
};

// Customer login
export const loginCustomer = async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    // Login by phone
    const customer = await Customer.findOne({
      where: { phone: validatedData.phone },
    });
    if (!customer || !(await customer.validPassword(validatedData.password))) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }
    if (!customer.is_active) {
      return res
        .status(403)
        .json({ success: false, message: "Account is inactive" });
    }
    const token = generateToken(customer, "customer");
    res.json({ success: true, data: { customer, token } });
  } catch (error) {
    next(error);
  }
};
