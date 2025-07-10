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
          attributes: ["customer_id", "name", "phone"],
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
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: OrderItem,
          include: [Product],
        },
        {
          model: Delivery,
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
      // Admin/staff can update all fields and order items
      const { order: orderData, items } = req.body;

      // Validate status updates
      if (orderData && orderData.status) {
        const newStatus = orderData.status;
        const currentStatus = order.status;

        console.log("Status update validation:", {
          newStatus,
          currentStatus,
          hasDelivery: !!order.Delivery,
          deliveryStatus: order.Delivery?.delivery_status,
          hasPayment: !!order.Payment,
        });

        // Check if status transition is valid
        if (newStatus === "delivered") {
          // Can only set to delivered if there's a delivery record with delivered status
          const delivery = order.Delivery;
          if (!delivery || delivery.delivery_status !== "delivered") {
            return res.status(400).json({
              success: false,
              message:
                "Cannot set order status to 'delivered' without a delivered delivery record",
            });
          }
        } else if (newStatus === "confirmed") {
          // Can set to confirmed if there's a delivery record or payment
          const delivery = order.Delivery;
          const payment = order.Payment;
          if (!delivery && !payment) {
            return res.status(400).json({
              success: false,
              message:
                "Cannot set order status to 'confirmed' without a delivery or payment record",
            });
          }
        } else if (newStatus === "cancelled") {
          // Can cancel if not already delivered
          if (currentStatus === "delivered") {
            return res.status(400).json({
              success: false,
              message: "Cannot cancel an already delivered order",
            });
          }
        } else if (newStatus === "returned") {
          // Can only return if previously delivered
          if (currentStatus !== "delivered") {
            return res.status(400).json({
              success: false,
              message:
                "Cannot set order status to 'returned' unless it was previously delivered",
            });
          }
        }
      }

      // Validate payment status updates
      if (orderData && orderData.payment_status) {
        const newPaymentStatus = orderData.payment_status;
        const currentPaymentStatus = order.payment_status;

        if (newPaymentStatus === "paid") {
          // Can only set to paid if there's a payment record
          const payment = order.Payment;
          if (!payment) {
            return res.status(400).json({
              success: false,
              message:
                "Cannot set payment status to 'paid' without a payment record",
            });
          }
        } else if (newPaymentStatus === "pending") {
          // Can set to pending if payment was deleted
          const payment = order.Payment;
          if (payment) {
            return res.status(400).json({
              success: false,
              message:
                "Cannot set payment status to 'pending' while payment record exists",
            });
          }
        }
      }

      // Update order fields
      if (orderData) {
        const validatedData = orderSchema.partial().parse(orderData);
        await order.update(validatedData);
      }

      // Update order items if provided
      if (items && Array.isArray(items)) {
        // Store current order items for stock reversion
        const currentOrderItems = await OrderItem.findAll({
          where: { order_id: order.order_id },
        });

        // Revert stock for current items
        for (const currentItem of currentOrderItems) {
          const product = await Product.findByPk(currentItem.product_id);
          if (product) {
            await product.update({
              stock_quantity: product.stock_quantity + currentItem.quantity,
            });
          }
        }

        // Delete existing order items
        await OrderItem.destroy({
          where: { order_id: order.order_id },
        });

        // Create new order items
        for (const item of items) {
          const product = await Product.findByPk(item.product_id);
          if (!product) {
            throw new Error(`Product not found: ${item.product_id}`);
          }
          if (item.quantity > product.stock_quantity) {
            throw new Error(
              `Requested quantity (${item.quantity}) exceeds available stock (${product.stock_quantity}) for product ${product.name}`
            );
          }

          await OrderItem.create({
            order_id: order.order_id,
            product_id: item.product_id,
            quantity: item.quantity,
            price: product.price,
          });
        }

        // Recalculate total amount
        const orderItems = await OrderItem.findAll({
          where: { order_id: order.order_id },
          include: [Product],
        });

        const totalAmount = orderItems.reduce((sum, item) => {
          return sum + Number(item.price) * item.quantity;
        }, 0);

        await order.update({ total_amount: totalAmount });
      }
    }

    // Fetch updated order with all associations
    const updatedOrder = await Order.findByPk(req.params.id, {
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

    res.json({ success: true, data: updatedOrder });
  } catch (error) {
    next(error);
  }
};

// Delete an order (admin/staff only)
export const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: OrderItem,
          include: [Product],
        },
      ],
    });
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

    // Revert product stock before deleting order
    for (const orderItem of order.OrderItems) {
      const product = await Product.findByPk(orderItem.product_id);
      if (product) {
        await product.update({
          stock_quantity: product.stock_quantity + orderItem.quantity,
        });
      }
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
