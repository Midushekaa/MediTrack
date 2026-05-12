import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

// Routes
import userAuthRoutes from "./routes/auth.js";
import reminderRoutes from "./routes/reminderRoutes.js";
import missedDoseRoutes from "./routes/missedDoseRoutes.js";
import refillRoutes from "./routes/refillRoutes.js";
import medicationRoutes from "./routes/medicationRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import moodRoutes from "./routes/moodRoutes.js";
import adminAuthRoutes from "./routes/adminAuth.js";
import adminRoutes from "./routes/adminRoutes.js";
import Admin from "./models/Admin.js";
import bcrypt from "bcryptjs";

dotenv.config();

const app = express();

// =========================
// MIDDLEWARE
// =========================
app.use(
  cors({
    origin: true, // Dynamically allow the requesting origin
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

// Global Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// =========================
// DB CONNECTION
// =========================
connectDB().then(async () => {
  // Seed an Admin user if it doesn't exist
  try {
    const adminExists = await Admin.findOne({ email: "admin@meditrack.com" });
    if (!adminExists) {
      // Admin schema has pre-save hook for password hashing, so we just set plain text
      const newAdmin = new Admin({
        email: "admin@meditrack.com",
        password: "admin", 
        fullName: "MediTrack Admin"
      });
      await newAdmin.save();
      console.log("✅ Seeded default admin: admin@meditrack.com / admin");
    }
  } catch (err) {
    console.error("Admin seed error:", err);
  }
});

// =========================
// ROUTES
// =========================
app.use("/api/auth", userAuthRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/missed-doses", missedDoseRoutes);
app.use("/api/refills", refillRoutes);
app.use("/api/medications", medicationRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/moods", moodRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin", adminRoutes);

// =========================
// TEST ROUTE
// =========================
app.get("/", (req, res) => {
  res.send("🚀 API running successfully");
});

// =========================
// START SERVER
// =========================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);