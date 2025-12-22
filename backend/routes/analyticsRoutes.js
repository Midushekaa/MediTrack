import express from "express";
import Reminder from "../models/Reminder.js";

const router = express.Router();

// GET /api/analytics
router.get("/", async (req, res) => {
  try {
    const reminders = await Reminder.find();

    const medStats = {};
    const riskPrediction = {};

    reminders.forEach(r => {
      if (!medStats[r.medName]) medStats[r.medName] = { taken: 0, missed: 0 };
      
      // Count taken/missed
      if (r.status === "taken") medStats[r.medName].taken++;
      if (r.status === "missed") medStats[r.medName].missed++;
      
      const total = medStats[r.medName].taken + medStats[r.medName].missed;
      riskPrediction[r.medName] = total ? Math.round((medStats[r.medName].missed / total) * 100) : 0;
    });

    res.json({ medStats, riskPrediction });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
