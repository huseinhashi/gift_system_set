import { config } from "dotenv";

// Load environment variables
config();

// Environment variables
export const {
  PORT = 5000,
  JWT_SECRET,
  NODE_ENV,

  // Database config
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  MERCHANT_API_KEY,
  MERCHANT_API_USER_ID,
  MERCHANT_U_ID,
} = process.env;
