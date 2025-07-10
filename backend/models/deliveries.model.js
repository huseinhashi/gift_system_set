import { DataTypes } from "sequelize";
import sequelize from "../database/connection.js";

const Delivery = sequelize.define(
  "Delivery",
  {
    delivery_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "orders",
        key: "order_id",
      },
    },
    assigned_to: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "employees",
        key: "employee_id",
      },
    },
    delivery_status: {
      type: DataTypes.ENUM(
        "pending",
        "in_transit",
        "delivered",
        "failed",
        "returned"
      ),
      defaultValue: "pending",
    },
    delivery_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    scheduled_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    delivered_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "deliveries",
    timestamps: false,
  }
);

export default Delivery;
