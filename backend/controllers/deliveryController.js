import { Delivery, Employee, Order, Customer, Payment } from "../models/index.js";
import { Op } from "sequelize";

// List all deliveries (admin/staff only)
export const getAllDeliveries = async (req, res, next) => {
  try {
    const deliveries = await Delivery.findAll({
      include: [
        {
          model: Employee,
          attributes: ["employee_id", "name", "phone"],
        },
        {
          model: Order,
          include: [
            {
              model: Customer,
              attributes: ["customer_id", "name", "phone"],
            },
          ],
        },
      ],
      order: [["delivery_id", "DESC"]],
    });
    res.json({ success: true, data: deliveries });
  } catch (error) {
    next(error);
  }
};

// Get a single delivery
export const getDeliveryById = async (req, res, next) => {
  try {
    const delivery = await Delivery.findByPk(req.params.id, {
      include: [
        {
          model: Employee,
          attributes: ["employee_id", "name", "phone"],
        },
        {
          model: Order,
          include: [
            {
              model: Customer,
              attributes: ["customer_id", "name", "phone"],
            },
          ],
        },
      ],
    });
    if (!delivery) {
      return res
        .status(404)
        .json({ success: false, message: "Delivery not found" });
    }
    res.json({ success: true, data: delivery });
  } catch (error) {
    next(error);
  }
};

// Create a delivery
export const createDelivery = async (req, res, next) => {
  try {
    // Check if order exists and get current status
    const order = await Order.findByPk(req.body.order_id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Check if delivery already exists for this order
    const existingDelivery = await Delivery.findOne({
      where: { order_id: req.body.order_id },
    });
    if (existingDelivery) {
      return res.status(400).json({
        success: false,
        message:
          "Delivery already exists for this order. Only one delivery record is allowed per order.",
      });
    }

    // Check if employee exists
    const employee = await Employee.findByPk(req.body.assigned_to);
    if (!employee) {
      return res
        .status(404)
        .json({ success: false, message: "Employee not found" });
    }

    // Check if payment is recorded or order is paid before allowing delivery
    const payment = await Payment.findOne({
      where: { order_id: req.body.order_id }
    });
    
    if (!payment && order.payment_status !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Cannot create delivery. Payment must be recorded or order payment status must be 'paid'.",
      });
    }

    const delivery = await Delivery.create(req.body);

    // Update order status based on delivery status
    if (delivery.delivery_status === "delivered") {
      await order.update({ status: "delivered" });
    } else if (order.status === "pending") {
      await order.update({ status: "confirmed" });
    }

    res.status(201).json({ success: true, data: delivery });
  } catch (error) {
    next(error);
  }
};

// Update a delivery
export const updateDelivery = async (req, res, next) => {
  try {
    const delivery = await Delivery.findByPk(req.params.id);
    if (!delivery) {
      return res
        .status(404)
        .json({ success: false, message: "Delivery not found" });
    }

    const previousStatus = delivery.delivery_status;
    await delivery.update(req.body);

    // Update order status based on delivery status change
    const order = await Order.findByPk(delivery.order_id);
    if (order) {
      if (delivery.delivery_status === "delivered") {
        await order.update({ status: "delivered" });
      } else if (
        previousStatus === "delivered" &&
        delivery.delivery_status !== "delivered"
      ) {
        // If status changed from delivered to something else, revert order status
        await order.update({ status: "confirmed" });
      } else if (
        order.status === "pending" &&
        delivery.delivery_status !== "delivered"
      ) {
        await order.update({ status: "confirmed" });
      }
    }

    res.json({ success: true, data: delivery });
  } catch (error) {
    next(error);
  }
};

// Delete a delivery
export const deleteDelivery = async (req, res, next) => {
  try {
    const delivery = await Delivery.findByPk(req.params.id);
    if (!delivery) {
      return res
        .status(404)
        .json({ success: false, message: "Delivery not found" });
    }

    const orderId = delivery.order_id;
    const wasDelivered = delivery.delivery_status === "delivered";

    await delivery.destroy();

    // Update order status if delivery was deleted
    if (wasDelivered) {
      const order = await Order.findByPk(orderId);
      if (order) {
        // Check if there are other deliveries for this order
        const otherDeliveries = await Delivery.findOne({
          where: { order_id: orderId },
        });

        if (!otherDeliveries) {
          // No other deliveries, revert order status to confirmed
          await order.update({ status: "confirmed" });
        }
      }
    }

    res.json({ success: true, message: "Delivery deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Get all deliveries for the logged-in employee
export const getEmployeeDeliveries = async (req, res, next) => {
  try {
    const employeeId = req.employee.id;
    const deliveries = await Delivery.findAll({
      where: { assigned_to: employeeId },
      include: [
        {
          model: Order,
          include: [
            {
              model: Customer,
              attributes: ["customer_id", "name", "phone", "address"],
            },
          ],
        },
      ],
      order: [["delivery_id", "DESC"]],
    });
    res.json({ success: true, data: deliveries });
  } catch (error) {
    next(error);
  }
};

// Update a delivery by the assigned employee
export const updateEmployeeDelivery = async (req, res, next) => {
  try {
    const employeeId = req.employee.id;
    const delivery = await Delivery.findByPk(req.params.id, {
      include: [Order],
    });
    if (!delivery) {
      return res
        .status(404)
        .json({ success: false, message: "Delivery not found" });
    }
    if (delivery.assigned_to !== employeeId) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own deliveries",
      });
    }
    const allowedFields = ["delivery_status", "delivery_notes", "delivered_at"];
    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }
    await delivery.update(updateData);
    // Optionally update order status if delivered
    if (updateData.delivery_status === "delivered") {
      const order = await Order.findByPk(delivery.order_id);
      if (order) {
        await order.update({ status: "delivered" });
      }
    }
    res.json({ success: true, data: delivery });
  } catch (error) {
    next(error);
  }
};
