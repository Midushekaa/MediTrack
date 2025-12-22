import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import reminderRoutes from "./routes/reminderRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import missedDoseRoutes from "./routes/missedDoseRoutes.js";
import { startReminderScheduler } from "./jobs/scheduler.js";
import connectDB from "./config/db.js"; // import DB connection


dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// MongoDB connection
connectDB(); // use the centralized DB connection

// Base route
app.get("/", (req, res) => res.send("MediTrack API is running..."));

// Routes
app.use("/api/reminders", reminderRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/missed-doses", missedDoseRoutes);

// Start cron job
startReminderScheduler();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
