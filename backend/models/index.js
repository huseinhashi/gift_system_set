import { DataTypes } from "sequelize";
import sequelize from "../database/connection.js";

// Models
import Admin from "./admins.model.js";
import Employee from "./employees.model.js";
import Customer from "./customers.model.js";
import Product from "./products.model.js";
import Order from "./orders.model.js";
import OrderItem from "./order_items.model.js";
import Payment from "./payments.model.js";
import Delivery from "./deliveries.model.js";
import Review from "./reviews.model.js";

// Associations
Customer.hasMany(Order, { foreignKey: "customer_id" });
Order.belongsTo(Customer, { foreignKey: "customer_id" });

Order.hasMany(OrderItem, { foreignKey: "order_id" });
OrderItem.belongsTo(Order, { foreignKey: "order_id" });

Product.hasMany(OrderItem, { foreignKey: "product_id" });
OrderItem.belongsTo(Product, { foreignKey: "product_id" });

Order.hasMany(Payment, { foreignKey: "order_id" });
Payment.belongsTo(Order, { foreignKey: "order_id" });

Order.hasOne(Delivery, { foreignKey: "order_id" });
Delivery.belongsTo(Order, { foreignKey: "order_id" });

Employee.hasMany(Delivery, { foreignKey: "assigned_to" });
Delivery.belongsTo(Employee, { foreignKey: "assigned_to" });

Customer.hasMany(Review, { foreignKey: "customer_id" });
Review.belongsTo(Customer, { foreignKey: "customer_id" });

Product.hasMany(Review, { foreignKey: "product_id" });
Review.belongsTo(Product, { foreignKey: "product_id" });

export {
  Admin,
  Employee,
  Customer,
  Product,
  Order,
  OrderItem,
  Payment,
  Delivery,
  Review,
  sequelize,
};
