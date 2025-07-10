import { DataTypes } from "sequelize";
import sequelize from "../database/connection.js";

const Order = sequelize.define(
  "Order",
  {
    order_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "customers",
        key: "customer_id",
      },
    },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "confirmed",
        "delivered",
        "cancelled",
        "returned"
      ),
      defaultValue: "pending",
    },
    total_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    payment_status: {
      type: DataTypes.ENUM("pending", "paid", "failed"),
      defaultValue: "pending",
    },
    lat: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
    },
    lng: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "orders",
    timestamps: false,
  }
);

export default Order;
