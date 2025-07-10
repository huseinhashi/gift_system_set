import { DataTypes } from "sequelize";
import sequelize from "../database/connection.js";

const Payment = sequelize.define(
  "Payment",
  {
    payment_id: {
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
    payment_type: {
      type: DataTypes.ENUM("api", "cash"),
      allowNull: true,
    },
    transaction_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    transaction_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "payments",
    timestamps: false,
  }
);

export default Payment;
