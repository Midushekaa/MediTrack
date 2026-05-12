import express from "express";
import Analytics from "../models/Analytics.js";
import Medication from "../models/Medication.js";
import MissedDose from "../models/MissedDose.js";

const router = express.Router();

// GET /api/analytics
router.get("/", async (req, res) => {
  try {
    const userId = req.query.userId; // assume userId sent from frontend

    // Fetch analytics summary
    const analytics = await Analytics.findOne({ user: userId });

    // Fetch medication stats
    const meds = await Medication.find({ user_id: userId });
    const medStats = {};
    const riskPrediction = {};

    for (const med of meds) {
      const missedCount = await MissedDose.countDocuments({ user_id: userId, medication_name: med.name, status: "missed" });
      const totalTaken = analytics.adherence_rate; // example
      medStats[med.name] = { taken: totalTaken, missed: missedCount };
      riskPrediction[med.name] = Math.min(100, (missedCount / (missedCount + totalTaken)) * 100);
    }

    res.json({ medStats, riskPrediction, dailyData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;