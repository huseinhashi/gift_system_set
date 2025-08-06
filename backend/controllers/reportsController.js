import { Admin, Employee, Customer, Product, Order, Payment, Delivery } from "../models/index.js";
import { Op } from "sequelize";

// Helper function to get date range
const getDateRange = (filter) => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  switch (filter) {
    case 'today':
      return {
        start: startOfDay,
        end: now
      };
    case 'this_month':
      return {
        start: startOfMonth,
        end: now
      };
    case 'this_year':
      return {
        start: startOfYear,
        end: now
      };
    case 'custom':
      return null; // Will be handled separately
    default: // 'all'
      return {
        start: new Date(0), // Beginning of time
        end: now
      };
  }
};

// Get reports summary
export const getReportsSummary = async (req, res, next) => {
  try {
    const { filter = 'all', startDate, endDate } = req.query;
    
    let dateRange = getDateRange(filter);
    if (filter === 'custom' && startDate && endDate) {
      dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      };
    }

    // Get counts with proper date columns
    const [
      adminsCount,
      employeesCount,
      customersCount,
      productsCount,
      ordersCount,
      paymentsCount,
      deliveriesCount
    ] = await Promise.all([
      Admin.count({ where: dateRange ? { created_at: { [Op.between]: [dateRange.start, dateRange.end] } } : {} }),
      Employee.count({ where: dateRange ? { created_at: { [Op.between]: [dateRange.start, dateRange.end] } } : {} }),
      Customer.count({ where: dateRange ? { created_at: { [Op.between]: [dateRange.start, dateRange.end] } } : {} }),
      Product.count({ where: dateRange ? { created_at: { [Op.between]: [dateRange.start, dateRange.end] } } : {} }),
      Order.count({ where: dateRange ? { created_at: { [Op.between]: [dateRange.start, dateRange.end] } } : {} }),
      Payment.count({ where: dateRange ? { transaction_date: { [Op.between]: [dateRange.start, dateRange.end] } } : {} }),
      Delivery.count({ where: {} }) // Deliveries don't have created_at, so count all
    ]);

    // Get revenue data - payments don't have status, so get all payments
    const payments = await Payment.findAll({
      where: dateRange ? { transaction_date: { [Op.between]: [dateRange.start, dateRange.end] } } : {},
      attributes: ['amount']
    });

    const totalRevenue = payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);

    // Get recent activity
    const recentOrders = await Order.findAll({
      where: dateRange ? { created_at: { [Op.between]: [dateRange.start, dateRange.end] } } : {},
      order: [['created_at', 'DESC']],
      limit: 5,
      include: [
        { model: Customer, attributes: ['name', 'phone'] },
        { model: Payment, attributes: ['amount', 'payment_type'] }
      ]
    });

    res.json({
      success: true,
      data: {
        summary: {
          admins: adminsCount,
          employees: employeesCount,
          customers: customersCount,
          products: productsCount,
          orders: ordersCount,
          payments: paymentsCount,
          deliveries: deliveriesCount,
          revenue: totalRevenue
        },
        recentOrders,
        dateRange: {
          filter,
          start: dateRange?.start,
          end: dateRange?.end
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get detailed reports by type
export const getDetailedReport = async (req, res, next) => {
  try {
    const { type, filter = 'all', startDate, endDate } = req.query;
    
    let dateRange = getDateRange(filter);
    if (filter === 'custom' && startDate && endDate) {
      dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      };
    }

    let data = [];
    let totalCount = 0;

    switch (type) {
      case 'admins':
        data = await Admin.findAll({
          where: dateRange ? { created_at: { [Op.between]: [dateRange.start, dateRange.end] } } : {},
          order: [['created_at', 'DESC']],
          attributes: ['admin_id', 'name', 'email', 'phone', 'wallet_address', 'role', 'is_active', 'created_at']
        });
        totalCount = data.length;
        break;

      case 'employees':
        data = await Employee.findAll({
          where: dateRange ? { created_at: { [Op.between]: [dateRange.start, dateRange.end] } } : {},
          order: [['created_at', 'DESC']],
          attributes: ['employee_id', 'name', 'phone', 'email', 'is_active', 'created_at']
        });
        totalCount = data.length;
        break;

      case 'customers':
        data = await Customer.findAll({
          where: dateRange ? { created_at: { [Op.between]: [dateRange.start, dateRange.end] } } : {},
          order: [['created_at', 'DESC']],
          attributes: ['customer_id', 'name', 'phone', 'address', 'is_active', 'created_at']
        });
        totalCount = data.length;
        break;

      case 'products':
        data = await Product.findAll({
          where: dateRange ? { created_at: { [Op.between]: [dateRange.start, dateRange.end] } } : {},
          order: [['created_at', 'DESC']],
          attributes: ['product_id', 'name', 'description', 'price', 'stock_quantity', 'category', 'is_active', 'created_at']
        });
        totalCount = data.length;
        break;

      case 'orders':
        data = await Order.findAll({
          where: dateRange ? { created_at: { [Op.between]: [dateRange.start, dateRange.end] } } : {},
          order: [['created_at', 'DESC']],
          include: [
            { model: Customer, attributes: ['name', 'phone'] },
            { model: Payment, attributes: ['amount', 'payment_type'] }
          ],
          attributes: ['order_id', 'total_amount', 'status', 'created_at']
        });
        totalCount = data.length;
        break;

      case 'payments':
        data = await Payment.findAll({
          where: dateRange ? { transaction_date: { [Op.between]: [dateRange.start, dateRange.end] } } : {},
          order: [['transaction_date', 'DESC']],
          include: [
            { model: Order, attributes: ['order_id', 'total_amount'] }
          ],
          attributes: ['payment_id', 'amount', 'payment_type', 'transaction_id', 'transaction_date']
        });
        totalCount = data.length;
        break;

      case 'deliveries':
        data = await Delivery.findAll({
          where: {}, // Deliveries don't have created_at, so get all
          order: [['delivery_id', 'DESC']],
          include: [
            { model: Order, attributes: ['order_id', 'total_amount'] },
            { model: Employee, attributes: ['name', 'phone'] }
          ],
          attributes: ['delivery_id', 'delivery_status', 'delivery_notes', 'scheduled_date', 'delivered_at']
        });
        totalCount = data.length;
        break;

      default:
        return res.status(400).json({
          success: false,
          message: "Invalid report type"
        });
    }

    res.json({
      success: true,
      data: {
        type,
        totalCount,
        data,
        dateRange: {
          filter,
          start: dateRange?.start,
          end: dateRange?.end
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get analytics data
export const getAnalytics = async (req, res, next) => {
  try {
    const { filter = 'all', startDate, endDate } = req.query;
    
    let dateRange = getDateRange(filter);
    if (filter === 'custom' && startDate && endDate) {
      dateRange = {
        start: new Date(startDate),
        end: new Date(endDate)
      };
    }

    // Revenue analytics - get all payments since they don't have status
    const payments = await Payment.findAll({
      where: dateRange ? { transaction_date: { [Op.between]: [dateRange.start, dateRange.end] } } : {},
      attributes: ['amount', 'transaction_date']
    });

    const totalRevenue = payments.reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
    const averageOrderValue = payments.length > 0 ? totalRevenue / payments.length : 0;

    // Order status analytics
    const orders = await Order.findAll({
      where: dateRange ? { created_at: { [Op.between]: [dateRange.start, dateRange.end] } } : {},
      attributes: ['status', 'total_amount']
    });

    const orderStatusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    // Product analytics
    const products = await Product.findAll({
      where: dateRange ? { created_at: { [Op.between]: [dateRange.start, dateRange.end] } } : {},
      attributes: ['category', 'stock_quantity', 'price']
    });

    const categoryCounts = products.reduce((acc, product) => {
      acc[product.category] = (acc[product.category] || 0) + 1;
      return acc;
    }, {});

    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.stock_quantity < 10).length;

    res.json({
      success: true,
      data: {
        revenue: {
          total: totalRevenue,
          averageOrderValue,
          totalOrders: payments.length
        },
        orders: {
          total: orders.length,
          statusBreakdown: orderStatusCounts
        },
        products: {
          total: totalProducts,
          categories: categoryCounts,
          lowStock: lowStockProducts
        },
        dateRange: {
          filter,
          start: dateRange?.start,
          end: dateRange?.end
        }
      }
    });
  } catch (error) {
    next(error);
  }
}; 