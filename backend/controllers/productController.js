import { Product } from "../models/index.js";
import { productSchema } from "../validators/validator.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imagesDir = path.join(__dirname, "../images");

// List all products
export const getAllProducts = async (req, res, next) => {
  try {
    const products = await Product.findAll({ order: [["created_at", "DESC"]] });
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

// Get a single product
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// Create a product
export const createProduct = async (req, res, next) => {
  try {
    const validatedData = productSchema.parse(req.body);
    if (req.file) {
      validatedData.image_url = req.file.filename;
    }
    const product = await Product.create(validatedData);
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// Update a product
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    const validatedData = productSchema.partial().parse(req.body);
    if (req.file) {
      // Delete old image if exists
      if (product.image_url) {
        const oldImagePath = path.join(imagesDir, product.image_url);
        try {
          await fs.unlink(oldImagePath);
        } catch (err) {
          // Ignore if file does not exist
        }
      }
      validatedData.image_url = req.file.filename;
    }
    await product.update(validatedData);
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// Delete a product
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    // Delete image if exists
    if (product.image_url) {
      const imagePath = path.join(imagesDir, product.image_url);
      try {
        await fs.unlink(imagePath);
      } catch (err) {
        // Ignore if file does not exist
      }
    }
    await product.destroy();
    res.json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    next(error);
  }
};
