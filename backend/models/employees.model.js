import { DataTypes } from "sequelize";
import sequelize from "../database/connection.js";
import bcrypt from "bcryptjs";

const Employee = sequelize.define(
  "Employee",
  {
    employee_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING(20),
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
    tableName: "employees",
    timestamps: false,
    hooks: {
      beforeCreate: async (employee) => {
        if (employee.password_hash) {
          employee.password_hash = await bcrypt.hash(
            employee.password_hash,
            10
          );
        }
      },
      beforeUpdate: async (employee) => {
        if (employee.changed("password_hash")) {
          employee.password_hash = await bcrypt.hash(
            employee.password_hash,
            10
          );
        }
      },
    },
  }
);

Employee.prototype.validPassword = async function (password) {
  return await bcrypt.compare(password, this.password_hash);
};

export default Employee;
