import { Employee } from "../models/index.js";
import { employeeSchema } from "../validators/validator.js";

// List all employees (admin/staff only)
export const getAllEmployees = async (req, res, next) => {
  try {
    const employees = await Employee.findAll({
      order: [["created_at", "DESC"]],
    });
    res.json({ success: true, data: employees });
  } catch (error) {
    next(error);
  }
};

// Get a single employee (admin/staff only)
export const getEmployeeById = async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }
    res.json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

// Create an employee (admin/staff only)
export const createEmployee = async (req, res, next) => {
  try {
    const validatedData = employeeSchema.parse(req.body);

    // Check if email is already in use
    const existingEmail = await Employee.findOne({
      where: { email: validatedData.email },
    });
    if (existingEmail) {
      return res
        .status(400)
        .json({ success: false, message: "Email already in use" });
    }

    // Check if phone is already in use
    const existingPhone = await Employee.findOne({
      where: { phone: validatedData.phone },
    });
    if (existingPhone) {
      return res
        .status(400)
        .json({ success: false, message: "Phone already in use" });
    }

    const employee = await Employee.create(validatedData);
    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

// Update an employee (admin/staff only)
export const updateEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }
    const validatedData = employeeSchema.partial().parse(req.body);
    await employee.update(validatedData);
    res.json({ success: true, data: employee });
  } catch (error) {
    next(error);
  }
};

// Delete an employee (admin/staff only)
export const deleteEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findByPk(req.params.id);
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }
    await employee.destroy();
    res.json({ success: true, message: "Employee deleted successfully" });
  } catch (error) {
    next(error);
  }
};
