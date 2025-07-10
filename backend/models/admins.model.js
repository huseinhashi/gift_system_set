import { DataTypes } from "sequelize";
import sequelize from "../database/connection.js";
import bcrypt from "bcrypt";

const Admin = sequelize.define(
  "Admin",
  {
    admin_id: {
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
    role: {
      type: DataTypes.ENUM("admin", "staff"),
      defaultValue: "staff",
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "admins",
    timestamps: false,
    hooks: {
      beforeCreate: async (admin) => {
        if (admin.password_hash) {
          admin.password_hash = await bcrypt.hash(admin.password_hash, 10);
        }
      },
      beforeUpdate: async (admin) => {
        if (admin.changed("password_hash")) {
          admin.password_hash = await bcrypt.hash(admin.password_hash, 10);
        }
      },
    },
  }
);

Admin.prototype.validPassword = async function (password) {
  return await bcrypt.compare(password, this.password_hash);
};

export default Admin;
