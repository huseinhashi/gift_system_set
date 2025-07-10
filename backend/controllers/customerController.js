import { Customer } from "../models/index.js";
import { customerSchema } from "../validators/validator.js";

// List all customers (admin only)
export const getAllCustomers = async (req, res, next) => {
  try {
    const customers = await Customer.findAll({
      order: [["created_at", "DESC"]],
    });
    res.json({ success: true, data: customers });
  } catch (error) {
    next(error);
  }
};

// Get a single customer (admin only)
export const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

// Create a customer (public registration)
export const createCustomer = async (req, res, next) => {
  try {
    const validatedData = customerSchema.parse(req.body);
    const existing = await Customer.findOne({
      where: { phone: validatedData.phone },
    });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Phone already in use" });
    }
    const customer = await Customer.create(validatedData);
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

// Update a customer (admin only)
export const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }
    const validatedData = customerSchema.partial().parse(req.body);
    await customer.update(validatedData);
    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

// Delete a customer (admin only)
export const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByPk(req.params.id);
    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }
    await customer.destroy();
    res.json({ success: true, message: "Customer deleted successfully" });
  } catch (error) {
    next(error);
  }
};
