import { Admin } from "../models/index.js";

const seedDatabase = async () => {
  try {
    // Create the first admin if not exists
    const adminExists = await Admin.findOne();
    if (!adminExists) {
      await Admin.create({
        name: "Super Admin",
        email: "admin@gmail.com",
        phone: "252610000000",
        wallet_address: "0x52aF5f6a96e84D2eA8aFB4e7117562D6007A7A0c", // Example wallet address
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
