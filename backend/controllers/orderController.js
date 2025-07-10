import {
  Order,
  OrderItem,
  Product,
  sequelize,
  Customer,
  Delivery,
  Payment,
  Employee,
} from "../models/index.js";
import { orderSchema, orderItemSchema } from "../validators/validator.js";

// List all orders (admin/staff only)
export const getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.findAll({
      order: [["created_at", "DESC"]],
      include: [
        {
          model: Customer,
          attributes: ["customer_id", "name"],
        },
      ],
    });
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

// Get a single order (admin/staff only or customer if they own it)
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: Customer,
          attributes: ["customer_id", "name", "phone", "address"],
        },
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              attributes: ["product_id", "name", "description", "image_url"],
            },
          ],
        },
        {
          model: Delivery,
          include: [
            {
              model: Employee,
              attributes: ["employee_id", "name", "phone"],
            },
          ],
        },
        {
          model: Payment,
        },
      ],
    });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Check if customer is trying to access their own order
    if (req.customer && order.customer_id !== req.customer.id) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own orders",
      });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// Create an order (admin/staff only)
export const createOrder = async (req, res, next) => {
  try {
    const validatedData = orderSchema.parse(req.body);
    const order = await Order.create(validatedData);
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// Update an order (admin/staff only or customer if they own it)
export const updateOrder = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Check if customer is trying to update their own order
    if (req.customer && order.customer_id !== req.customer.id) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own orders",
      });
    }

    // For customers, only allow updating certain fields
    if (req.customer) {
      const allowedFields = ["lat", "lng", "status", "payment_status"];
      const updateData = {};

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }

      const validatedData = orderSchema
        .partial()
        .pick({
          lat: true,
          lng: true,
          status: true,
          payment_status: true,
        })
        .parse(updateData);

      await order.update(validatedData);
    } else {
      // Admin/staff can update all fields
      const validatedData = orderSchema.partial().parse(req.body);
      await order.update(validatedData);
    }

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// Delete an order (admin/staff only)
export const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    if (order.status === "delivered" || order.payment_status === "paid") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete order: already delivered or payment received.",
      });
    }
    await order.destroy();
    res.json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Bulk create order with items (transactional)
export const createOrderWithItems = async (req, res, next) => {
  const t = await sequelize.transaction();
  try {
    const { order, items } = req.body;
    console.log(req.body);
    // Determine customer_id based on authentication type
    let customerId;
    if (req.admin) {
      // Admin/staff creating order for a customer
      customerId = order.customer_id;
    } else if (req.customer) {
      // Customer creating their own order
      customerId = req.customer.id;
      // Override any customer_id in the request for security
      order.customer_id = customerId;
    } else {
      throw new Error("Authentication required");
    }

    // Validate order (no status, total_amount, payment_status)
    const validatedOrder = orderSchema.parse(order);
    // Validate items (no price)
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("Order must have at least one item");
    }
    const validatedItems = items.map((item) =>
      orderItemSchema.omit({ order_id: true }).parse(item)
    );
    // Check customer existence
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      await t.rollback();
      return res.status(400).json({
        success: false,
        message: `Customer not found: ${customerId}`,
      });
    }
    // Calculate total and create order
    let totalAmount = 0;
    const orderItemsToCreate = [];
    for (const item of validatedItems) {
      const product = await Product.findByPk(item.product_id, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!product) {
        throw new Error(`Product not found: ${item.product_id}`);
      }
      if (item.quantity > product.stock_quantity) {
        throw new Error(
          `Requested quantity (${item.quantity}) exceeds available stock (${product.stock_quantity}) for product ${product.name}`
        );
      }

      await product.update(
        { stock_quantity: product.stock_quantity - item.quantity },
        { transaction: t }
      );

      const itemTotal = Number(product.price) * item.quantity;
      totalAmount += itemTotal;
      orderItemsToCreate.push({
        product_id: item.product_id,
        quantity: item.quantity,
        price: product.price,
      });
    }
    // Set order fields
    const newOrder = await Order.create(
      {
        ...validatedOrder,
        total_amount: totalAmount,
        status: "pending",
        payment_status: "pending",
        // lat: 2.45,
        // lng: 101.45,
      },
      { transaction: t }
    );
    // Create order items
    for (const item of orderItemsToCreate) {
      await OrderItem.create(
        { ...item, order_id: newOrder.order_id },
        { transaction: t }
      );
    }
    await t.commit();
    // Fetch order with items to return
    const createdOrder = await Order.findByPk(newOrder.order_id, {
      include: [OrderItem],
    });
    res.status(201).json({ success: true, data: createdOrder });
  } catch (error) {
    await t.rollback();
    next(error);
  }
};

// Get all orders for the logged-in customer
export const getCustomerOrders = async (req, res, next) => {
  try {
    const customerId = req.customer.id;

    const orders = await Order.findAll({
      where: { customer_id: customerId },
      order: [["created_at", "DESC"]],
      include: [
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              attributes: [
                "product_id",
                "name",
                "description",
                "image_url",
                "price",
              ],
            },
          ],
        },
        {
          model: Delivery,
          include: [
            {
              model: Employee,
              attributes: ["employee_id", "name", "phone"],
            },
          ],
        },
        {
          model: Payment,
        },
      ],
    });

    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

// Get a single order for the logged-in customer
export const getCustomerOrderById = async (req, res, next) => {
  try {
    const customerId = req.customer.id;
    const orderId = req.params.id;

    const order = await Order.findOne({
      where: {
        order_id: orderId,
        customer_id: customerId,
      },
      include: [
        {
          model: OrderItem,
          include: [
            {
              model: Product,
              attributes: [
                "product_id",
                "name",
                "description",
                "image_url",
                "price",
              ],
            },
          ],
        },
        {
          model: Delivery,
          include: [
            {
              model: Employee,
              attributes: ["employee_id", "name", "phone"],
            },
          ],
        },
        {
          model: Payment,
        },
      ],
    });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// Update an order for the logged-in customer (limited fields)
export const updateCustomerOrder = async (req, res, next) => {
  try {
    const customerId = req.customer.id;
    const orderId = req.params.id;

    const order = await Order.findOne({
      where: {
        order_id: orderId,
        customer_id: customerId,
      },
    });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Only allow updating certain fields for customers
    const allowedFields = ["lat", "lng", "status", "payment_status"];
    const updateData = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    // Validate the update data
    const validatedData = orderSchema
      .partial()
      .pick({
        lat: true,
        lng: true,
        status: true,
        payment_status: true,
      })
      .parse(updateData);

    await order.update(validatedData);

    res.json({
      success: true,
      data: order,
      message: "Order updated successfully",
    });
  } catch (error) {
    next(error);
  }
};
