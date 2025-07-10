import express from "express";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import {
  validate,
  validatePartial,
} from "../middlewares/validationMiddleware.js";
import { productSchema } from "../validators/validator.js";
import {
  authenticateAdmin,
  restrictToAdmin,
} from "../middlewares/authmiddleware.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
// Configure multer for handling image uploads
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../images"));
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});
// Public: List and get
router.get("/", getAllProducts);
router.get("/:id", getProductById);

// Admin only: Create, update, delete
router.post(
  "/",
  authenticateAdmin,
  restrictToAdmin("admin", "staff"),
  upload.single("image"),
  validate(productSchema),
  createProduct
);
router.put(
  "/:id",
  authenticateAdmin,
  restrictToAdmin("admin", "staff"),
  upload.single("image"),
  validatePartial(productSchema),
  updateProduct
);
router.delete(
  "/:id",
  authenticateAdmin,
  restrictToAdmin("admin", "staff"),
  deleteProduct
);

export default router;
