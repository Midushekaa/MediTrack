import express from "express";
import Reminder from "../models/Reminder.js";
import { authUser } from "../middleware/auth.js";

const router = express.Router();

// =========================
// CREATE REMINDER
// =========================
router.post("/", authUser, async (req, res) => {
  try {
    const {
      medication_name,
      reminder_time,
      reminder_date,       // YYYY-MM-DD — required by model
      reminder_type,
      voice_prompt,
    } = req.body;

    if (!medication_name || !reminder_time || !reminder_date) {
      return res.status(400).json({ message: "Missing required fields: medication_name, reminder_time, reminder_date" });
    }

    const reminder = new Reminder({
      user: req.user._id,
      medication_name,
      reminder_time,  // HH:mm
      reminder_date,  // YYYY-MM-DD
      reminder_type,
      voice_prompt,
      status: "pending",
      takenTime: null,
    });

    await reminder.save();
    res.status(201).json(reminder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error creating reminder: " + err.message, err });
  }
});

// =========================
// GET ALL REMINDERS
// =========================
router.get("/", authUser, async (req, res) => {
  try {
    const data = await Reminder.find({ user: req.user._id }).sort({ reminder_time: 1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Error fetching reminders" });
  }
});

// =========================
// RESCHEDULE REMINDER  ← must be BEFORE /:id to avoid route conflict
// =========================
router.put("/:id/reschedule", authUser, async (req, res) => {
  try {
    const { reminder_date, reminder_time } = req.body;

    if (!reminder_date || !reminder_time) {
      return res.status(400).json({ message: "reminder_date and reminder_time are required" });
    }

    const updated = await Reminder.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      {
        reminder_date,
        reminder_time,
        status: "pending",   // reset so it shows up as active again
        takenTime: null,
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Reschedule failed: " + err.message });
  }
});

// =========================
// UPDATE STATUS
// =========================
router.put("/:id", authUser, async (req, res) => {
  try {
    let { action } = req.body;

    const allowed = ["pending", "taken", "missed", "skipped"];

    if (!allowed.includes(action)) {
      return res.status(400).json({ message: "Invalid action" });
    }

    if (action === "skipped") action = "missed";

    const updateData = {
      status: action,
    };

    if (action === "taken") {
      updateData.takenTime = new Date();
    }

    if (action === "missed") {
      updateData.takenTime = null;
    }

    const updated = await Reminder.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updateData,
      { new: true }
    );

    if (!updated) {
       return res.status(404).json({ message: "Reminder not found" });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
});

export default router;