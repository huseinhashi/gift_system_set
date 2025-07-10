import { OrderItem, Product } from "../models/index.js";
import { orderItemSchema } from "../validators/validator.js";

// List all order items (admin/staff only)
export const getAllOrderItems = async (req, res, next) => {
  try {
    const orderItems = await OrderItem.findAll();
    res.json({ success: true, data: orderItems });
  } catch (error) {
    next(error);
  }
};

// Get a single order item (admin/staff only)
export const getOrderItemById = async (req, res, next) => {
  try {
    const orderItem = await OrderItem.findByPk(req.params.id);
    if (!orderItem) {
      return res
        .status(404)
        .json({ success: false, message: "Order item not found" });
    }
    res.json({ success: true, data: orderItem });
  } catch (error) {
    next(error);
  }
};

// Create an order item (admin/staff only)
export const createOrderItem = async (req, res, next) => {
  try {
    const validatedData = orderItemSchema.parse(req.body);
    // Check product stock
    const product = await Product.findByPk(validatedData.product_id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    if (validatedData.quantity > product.stock_quantity) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity (${validatedData.quantity}) exceeds available stock (${product.stock_quantity})`,
      });
    }
    // Deduct stock
    await product.update({
      stock_quantity: product.stock_quantity - validatedData.quantity,
    });
    const orderItem = await OrderItem.create(validatedData);
    res.status(201).json({ success: true, data: orderItem });
  } catch (error) {
    next(error);
  }
};

// Update an order item (admin/staff only)
export const updateOrderItem = async (req, res, next) => {
  try {
    const orderItem = await OrderItem.findByPk(req.params.id);
    if (!orderItem) {
      return res
        .status(404)
        .json({ success: false, message: "Order item not found" });
    }
    const validatedData = orderItemSchema.partial().parse(req.body);
    // Only handle quantity change and stock adjustment if quantity is being updated
    if (
      validatedData.quantity !== undefined &&
      validatedData.quantity !== orderItem.quantity
    ) {
      const product = await Product.findByPk(orderItem.product_id);
      if (!product) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }
      const diff = validatedData.quantity - orderItem.quantity;
      if (diff > 0) {
        // Increasing quantity: check stock
        if (diff > product.stock_quantity) {
          return res.status(400).json({
            success: false,
            message: `Requested increase (${diff}) exceeds available stock (${product.stock_quantity})`,
          });
        }
        await product.update({ stock_quantity: product.stock_quantity - diff });
      } else if (diff < 0) {
        // Decreasing quantity: restore stock
        await product.update({
          stock_quantity: product.stock_quantity + Math.abs(diff),
        });
      }
    }
    await orderItem.update(validatedData);
    res.json({ success: true, data: orderItem });
  } catch (error) {
    next(error);
  }
};

// Delete an order item (admin/staff only)
export const deleteOrderItem = async (req, res, next) => {
  try {
    const orderItem = await OrderItem.findByPk(req.params.id);
    if (!orderItem) {
      return res
        .status(404)
        .json({ success: false, message: "Order item not found" });
    }
    // Restore product stock
    const product = await Product.findByPk(orderItem.product_id);
    if (product) {
      await product.update({
        stock_quantity: product.stock_quantity + orderItem.quantity,
      });
    }
    await orderItem.destroy();
    res.json({ success: true, message: "Order item deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Get all order items for a specific order (admin/staff only)
export const getOrderItemsByOrderId = async (req, res, next) => {
  try {
    const { order_id } = req.params;
    const orderItems = await OrderItem.findAll({
      where: { order_id },
      include: [Product],
    });
    res.json({ success: true, data: orderItems });
  } catch (error) {
    next(error);
  }
};
