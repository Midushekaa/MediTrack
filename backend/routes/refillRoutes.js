import express from "express";
import RefillReminder from "../models/RefillReminder.js";
import { authUser } from "../middleware/auth.js";

const router = express.Router();

// =========================
// CREATE REFILL REMINDER
// =========================
router.post("/", authUser, async (req, res) => {
  try {
    const {
      medication_name,
      remaining_pills,
      threshold,
      reminder_date,
      morning_time,
      afternoon_time,
      evening_time
    } = req.body;

    if (!medication_name) {
      return res.status(400).json({ message: "Medication name is required" });
    }

    const refill = new RefillReminder({
      user: req.user._id,
      medication_name,
      remaining_pills,
      threshold,
      reminder_date,
      morning_time,
      afternoon_time,
      evening_time,
    });

    await refill.save();
    res.status(201).json(refill);
  } catch (err) {
    console.error("Backend Error in /api/refills:", err.message);
    res.status(500).json({ message: "Backend Error: " + err.message, stack: err.stack });
  }
});

// =========================
// GET ALL REFILL REMINDERS
// =========================
router.get("/", authUser, async (req, res) => {
  try {
    const data = await RefillReminder.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error fetching refill reminders: " + err.message });
  }
});

// =========================
// DELETE REFILL REMINDER
// =========================
router.delete("/:id", authUser, async (req, res) => {
  try {
    await RefillReminder.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: "Refill deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting refill reminder: " + err.message });
  }
});

export default router;