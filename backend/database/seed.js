import { Admin } from "../models/index.js";

const seedDatabase = async () => {
  try {
    // Create the first admin if not exists
    const adminExists = await Admin.findOne();
    if (!adminExists) {
      await Admin.create({
        name: "Super Admin",
        email: "admin@gifts.com",
        phone: "252612345678",
        password_hash: "admin12345", // Will be hashed by model hook
        role: "admin",
        is_active: true,
      });
      console.log("First admin created!");
    } else {
      console.log("Admin already exists.");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};

export default seedDatabase;
