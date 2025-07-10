import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";

// Middleware to authenticate users and clients
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication token is missing or invalid",
    });
  }

  const authToken = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(authToken, JWT_SECRET);
    req.user = decoded; // Attach the decoded token payload to the request object
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// Middleware to authenticate admins (admin/staff)
export const authenticateAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication token is missing or invalid",
    });
  }
  const authToken = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(authToken, JWT_SECRET);
    if (!["admin", "staff"].includes(decoded.role)) {
      return res.status(403).json({
        success: false,
        message: "Not an admin or staff token",
      });
    }
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// Middleware to authenticate employees
export const authenticateEmployee = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication token is missing or invalid",
    });
  }
  const authToken = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(authToken, JWT_SECRET);
    if (decoded.type !== "employee") {
      return res.status(403).json({
        success: false,
        message: "Not an employee token",
      });
    }
    req.employee = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// Middleware to authenticate customers
export const authenticateCustomer = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication token is missing or invalid",
    });
  }
  const authToken = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(authToken, JWT_SECRET);
    if (decoded.type !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Not a customer token",
      });
    }
    req.customer = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

// Role-based restriction for admin/staff
export const restrictToAdmin = (...roles) => {
  return (req, res, next) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }
    next();
  };
};

// Role-based restriction for employees
export const restrictToEmployee = (req, res, next) => {
  if (!req.employee) {
    return res.status(403).json({
      success: false,
      message: "You do not have permission to perform this action",
    });
  }
  next();
};

// Role-based restriction for customers
export const restrictToCustomer = (req, res, next) => {
  if (!req.customer) {
    return res.status(403).json({
      success: false,
      message: "You do not have permission to perform this action",
    });
  }
  next();
};

// Error handler middleware for consistent error responses
export const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  // Handle Zod validation errors
  if (err.name === "ZodError") {
    const errors = err.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: errors,
    });
  }

  // Handle Sequelize ForeignKeyConstraintError
  if (err.name === "SequelizeForeignKeyConstraintError") {
    let message =
      "A related resource was not found or is referenced incorrectly.";
    if (err.table && err.index) {
      message += ` (Table: ${err.table}, Index: ${err.index})`;
    }
    return res.status(400).json({
      success: false,
      message: "Foreign key constraint error",
      errors: message,
    });
  }

  // Handle Sequelize validation errors
  if (
    err.name === "SequelizeValidationError" ||
    err.name === "SequelizeUniqueConstraintError"
  ) {
    const errors = err.errors.map((e) => e.message).join(", ");
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: errors,
    });
  }

  // Default error response
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
};
