import express from "express";
import {
  getReportsSummary,
  getDetailedReport,
  getAnalytics,
} from "../controllers/reportsController.js";
import {
  authenticateAdmin,
  restrictToAdmin,
} from "../middlewares/authmiddleware.js";

const router = express.Router();

// All reports routes require admin authentication
router.use(authenticateAdmin);
router.use(restrictToAdmin("admin"));

// Get reports summary
router.get("/summary", getReportsSummary);

// Get detailed reports by type
router.get("/detailed/:type", getDetailedReport);

// Get analytics data
router.get("/analytics", getAnalytics);

export default router; 