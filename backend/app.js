import express from "express";
import cors from "cors";
import morgan from "morgan";
import { config } from "dotenv";
import { errorHandler } from "./middlewares/authmiddleware.js";
import routes from "./routes/index.js";
import { connectDB } from "./database/connection.js";
import syncDatabase from "./database/sync.js";
import seedDatabase from "./database/seed.js";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/images", express.static(path.join(__dirname, "images")));

// Welcome route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Gifts & Flower Shop API",
    version: "1.0.0",
  });
});

// API Routes
app.use("/api/v1", routes);

// Global error handler
app.use(errorHandler);

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Database connection and server startup
const startServer = async () => {
  try {
    app.listen(PORT, async () => {
      await connectDB(); // Test the database connection
      await syncDatabase(); // Call the function to sync the database
      await seedDatabase(); // Call the function to seed the database
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    process.exit(1);
  }
};

startServer();

export default app;
