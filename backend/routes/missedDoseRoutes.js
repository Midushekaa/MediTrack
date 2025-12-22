import express from "express";
import MissedDose from "../models/MissedDose.js";
import { authUser } from "../middleware/auth.js";

const router = express.Router();

// GET all missed doses for logged-in user
router.get("/", authUser, async (req, res) => {
  try {
    const doses = await MissedDose.find({ user: req.user._id, status: "missed" });
    res.json(doses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST update a missed dose action
router.post("/:id", authUser, async (req, res) => {
  const { action, time } = req.body;
  try {
    const dose = await MissedDose.findById(req.params.id);
    if (!dose) return res.status(404).json({ message: "Dose not found" });

    if (action === "take_now") {
      dose.status = "late";
      dose.actual_time = time || new Date();
    } else if (action === "skip") {
      dose.status = "skipped";
    } else if (action === "reschedule") {
      dose.scheduled_time = new Date(new Date(dose.scheduled_time).getTime() + 60 * 60 * 1000);
      dose.status = "rescheduled";
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }

    await dose.save();
    res.json({ message: "Dose updated successfully", dose });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
