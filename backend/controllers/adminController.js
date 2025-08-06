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
    
    // Check if wallet address already exists
    const existing = await Admin.findOne({
      where: { wallet_address: validatedData.wallet_address.toLowerCase() },
    });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Wallet address already registered" });
    }
    
    // Ensure wallet address is lowercase
    validatedData.wallet_address = validatedData.wallet_address.toLowerCase();
    
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
    
    // If wallet address is being updated, check for duplicates
    if (validatedData.wallet_address) {
      const existing = await Admin.findOne({
        where: { 
          wallet_address: validatedData.wallet_address.toLowerCase(),
          admin_id: { [require('sequelize').Op.ne]: req.params.id }
        },
      });
      if (existing) {
        return res
          .status(400)
          .json({ success: false, message: "Wallet address already registered" });
      }
      validatedData.wallet_address = validatedData.wallet_address.toLowerCase();
    }
    
    await admin.update(validatedData);
    res.json({ success: true, data: admin });
  } catch (error) {
    next(error);
  }
};

// Delete an admin (super-admin only)
export const deleteAdmin = async (req, res, next) => {
  try {
    // Cannot delete last admin
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
