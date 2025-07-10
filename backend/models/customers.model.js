import { DataTypes } from "sequelize";
import sequelize from "../database/connection.js";
import bcrypt from "bcrypt";

const Customer = sequelize.define(
  "Customer",
  {
    customer_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    password_hash: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "customers",
    timestamps: false,
    hooks: {
      beforeCreate: async (customer) => {
        if (customer.password_hash) {
          customer.password_hash = await bcrypt.hash(
            customer.password_hash,
            10
          );
        }
      },
      beforeUpdate: async (customer) => {
        if (customer.changed("password_hash")) {
          customer.password_hash = await bcrypt.hash(
            customer.password_hash,
            10
          );
        }
      },
    },
  }
);

Customer.prototype.validPassword = async function (password) {
  return await bcrypt.compare(password, this.password_hash);
};

export default Customer;
