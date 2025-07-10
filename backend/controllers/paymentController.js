import { Payment, Order, Customer } from "../models/index.js";
import { paymentSchema } from "../validators/validator.js";
import { Pay } from "../services/pay.js";

// List all payments (admin/staff only)
export const getAllPayments = async (req, res, next) => {
  try {
    const payments = await Payment.findAll({
      include: [
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
      order: [["transaction_date", "DESC"]],
    });
    res.json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
};

// Get a single payment (admin/staff only)
export const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }
    res.json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

// Create a payment (admin/staff only)
export const createPayment = async (req, res, next) => {
  try {
    const validatedData = paymentSchema.parse(req.body);

    // Check if order exists
    const order = await Order.findByPk(validatedData.order_id);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Check if payment already exists for this order
    const existingPayment = await Payment.findOne({
      where: { order_id: validatedData.order_id },
    });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "Payment already exists for this order",
      });
    }

    // Set defaults for new payments
    const paymentData = {
      ...validatedData,
      payment_type: validatedData.payment_type || "cash",
      transaction_id: validatedData.transaction_id || null,
    };

    const payment = await Payment.create(paymentData);

    // Update order payment status to paid
    await order.update({
      status: "confirmed",
      payment_status: "paid",
    });
    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

// Update a payment (admin/staff only)
export const updatePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }

    const validatedData = paymentSchema.partial().parse(req.body);
    await payment.update(validatedData);

    // Update order payment status to paid (since payment exists)
    const order = await Order.findByPk(payment.order_id);
    if (order) {
      await order.update({ payment_status: "paid" });
    }

    res.json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

// Delete a payment (admin/staff only)
export const deletePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findByPk(req.params.id);
    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }

    const orderId = payment.order_id;
    await payment.destroy();

    // Check if there are other payments for this order
    const remainingPayments = await Payment.findOne({
      where: { order_id: orderId },
    });

    // Update order payment status
    const order = await Order.findByPk(orderId);
    if (order) {
      if (!remainingPayments) {
        // No payments left, set status to pending
        await order.update({ payment_status: "pending" });
      }
      // If payments still exist, status remains paid
    }

    res.json({ success: true, message: "Payment deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Get payments by order ID (admin/staff only)
export const getPaymentsByOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    // First check if order exists
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: Customer,
          attributes: ["customer_id", "name", "phone"],
        },
      ],
    });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Get payments for this order
    const payments = await Payment.findAll({
      where: { order_id: orderId },
      order: [["transaction_date", "DESC"]],
    });

    res.json({
      success: true,
      data: {
        order,
        payments,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Process payment (customer only)
export const processPayment = async (req, res, next) => {
  try {
    const { orderId, amount, phone } = req.body;
    const customerId = req.customer.id;

    // Validate required fields
    if (!orderId || !amount || !phone) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: orderId, amount, phone",
      });
    }

    // Validate amount is a valid number
    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount provided",
      });
    }

    // Check if order exists and belongs to the customer
    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: Customer,
          attributes: ["customer_id", "name", "phone"],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.customer_id !== customerId) {
      return res.status(403).json({
        success: false,
        message: "You can only process payments for your own orders",
      });
    }

    // Check if order is already paid
    if (order.payment_status === "paid") {
      return res.status(400).json({
        success: false,
        message: "Order is already paid",
      });
    }

    // Check for existing payment record for this order
    let payment = await Payment.findOne({ where: { order_id: orderId } });
    const orderAmount = Number(order.total_amount);

    if (
      payment &&
      Number(payment.amount) == orderAmount &&
      order.payment_status === "pending"
    ) {
      // There is a pending payment record, try to process it
      const paymentResult = await Pay(phone, orderAmount, orderId);
      if (paymentResult.success) {
        await order.update({
          status: "confirmed",
          payment_status: "paid",
        });
        await payment.update({
          payment_type: "api",
          transaction_id: paymentResult.referenceId,
          amount: orderAmount,
        });
        return res.json({
          success: true,
          message: "Payment processed successfully",
          data: {
            order,
            payment,
            referenceId: paymentResult.referenceId,
          },
        });
      } else {
        await order.update({ payment_status: "failed" });
        return res.json({
          success: false,
          message: paymentResult.message || "Payment processing failed",
          data: { order },
        });
      }
    } else if (payment && order.payment_status === "paid") {
      // Already paid
      return res.status(400).json({
        success: false,
        message: "Order is already paid",
      });
    } else if (!payment) {
      // No payment record yet, create and process
      const paymentResult = await Pay(phone, orderAmount, orderId);
      if (paymentResult.success) {
        await order.update({
          status: "confirmed",
          payment_status: "paid",
        });
        payment = await Payment.create({
          order_id: orderId,
          payment_type: "api",
          transaction_id: paymentResult.referenceId,
          amount: orderAmount,
        });
        return res.json({
          success: true,
          message: "Payment processed successfully",
          data: {
            order,
            payment,
            referenceId: paymentResult.referenceId,
          },
        });
      } else {
        await order.update({ payment_status: "failed" });
        return res.json({
          success: false,
          message: paymentResult.message || "Payment processing failed",
          data: { order },
        });
      }
    } else {
      // Fallback: payment exists but status is not clear
      return res.status(400).json({
        success: false,
        message: "Payment already exists for this order.",
      });
    }
  } catch (error) {
    console.error("Payment processing error:", error);
    next(error);
  }
};
