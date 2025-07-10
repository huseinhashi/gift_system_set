import { Admin } from "../models/index.js";
import { adminSchema } from "../validators/validator.js";

// List all admins (admin only)
export const getAllAdmins = async (req, res, next) => {
  try {
    const admins = await Admin.findAll({ order: [["created_at", "DESC"]] });
    res.json({ success: true, data: admins });
  } catch (error) {
    next(error);
  }
};

// Get a single admin (admin only)
export const getAdminById = async (req, res, next) => {
  try {
    const admin = await Admin.findByPk(req.params.id);
    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }
    res.json({ success: true, data: admin });
  } catch (error) {
    next(error);
  }
};

// Create an admin (super-admin only)
export const createAdmin = async (req, res, next) => {
  try {
    const validatedData = adminSchema.parse(req.body);
    const existing = await Admin.findOne({
      where: { email: validatedData.email },
    });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Email already in use" });
    }
    const admin = await Admin.create(validatedData);
    res.status(201).json({ success: true, data: admin });
  } catch (error) {
    next(error);
  }
};

// Update an admin (super-admin only)
export const updateAdmin = async (req, res, next) => {
  try {
    const admin = await Admin.findByPk(req.params.id);
    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }
    const validatedData = adminSchema.partial().parse(req.body);
    await admin.update(validatedData);
    res.json({ success: true, data: admin });
  } catch (error) {
    next(error);
  }
};

// Delete an admin (super-admin only)
export const deleteAdmin = async (req, res, next) => {
  try {
    //canot deleted last admin
    const admins = await Admin.findAll();
    if (admins.length === 1) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot delete last admin" });
    }
    const admin = await Admin.findByPk(req.params.id);
    if (!admin) {
      return res
        .status(404)
        .json({ success: false, message: "Admin not found" });
    }
    await admin.destroy();
    res.json({ success: true, message: "Admin deleted successfully" });
  } catch (error) {
    next(error);
  }
};
