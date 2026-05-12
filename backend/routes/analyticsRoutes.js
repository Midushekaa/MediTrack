import express from "express";
import Reminder from "../models/Reminder.js";
import Medication from "../models/Medication.js";
import axios from "axios";

const router = express.Router();

// Helper for AI Prediction Call
const getAdherencePrediction = async (missedCount, takenCount) => {
  try {
    const response = await axios.post("http://localhost:8000/predict", {
      missed_doses: missedCount,
      stress_level: 0.5,
      sleep_hours: 7.5,
    }, { timeout: 1000 });
    return response.data.adherence_probability;
  } catch (err) {
    const total = takenCount + missedCount;
    return total > 0 ? (takenCount / total) : 1.0;
  }
};

// GET /api/analytics
router.get("/", async (req, res) => {
  try {
    const reminders = await Reminder.find().sort({ reminder_time: 1 });
    const medications = await Medication.find();

    const medStats = {};
    const riskPrediction = {};
    const dailyDataMap = {};
    let totalMissed = 0;

    const processItem = (item, isMed) => {
      const medName = isMed ? item.name : item.medication_name;
      if (!medName) return;
      if (!medStats[medName]) medStats[medName] = { taken: 0, missed: 0 };

      if (item.status === "taken") medStats[medName].taken++;
      if (item.status === "missed") {
        medStats[medName].missed++;
        totalMissed++;
      }

      const total = medStats[medName].taken + medStats[medName].missed;
      riskPrediction[medName] = total
        ? Math.round((medStats[medName].missed / total) * 100)
        : 0;

      // Daily Data for Charts
      let dateKey = isMed 
        ? (item.startDate ? new Date(item.startDate).toISOString().slice(0, 10) : null)
        : item.reminder_date;

      if (!dateKey) dateKey = new Date().toISOString().slice(0, 10);

      if (!dailyDataMap[dateKey]) {
        dailyDataMap[dateKey] = { date: dateKey, taken: 0, missed: 0, pending: 0 };
      }
      if (item.status === "taken") dailyDataMap[dateKey].taken++;
      if (item.status === "missed") dailyDataMap[dateKey].missed++;
      if (item.status === "pending") dailyDataMap[dateKey].pending++;
    };

    reminders.forEach(r => processItem(r, false));
    medications.forEach(m => processItem(m, true));

    const totalTaken = Object.values(medStats).reduce((a, b) => a + b.taken, 0);

    let dailyData = [];
    try {
      dailyData = Object.values(dailyDataMap).sort((a, b) => {
        if (!a || !a.date || !b || !b.date) {
           console.log("Invalid date in sorting:", a, b);
           return 0;
        }
        return a.date.localeCompare(b.date);
      });
    } catch(err) {
      console.log("Sort error. Map:", dailyDataMap);
      throw err;
    }

    const predictionScore = await getAdherencePrediction(totalMissed, totalTaken);

    res.json({ 
      medStats, 
      riskPrediction, 
      dailyData,
      futurePrediction: Math.round(predictionScore * 100)
    });
  } catch (err) {
    console.error("Analytics Error:", err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analytics/report
router.get("/report", async (req, res) => {
  try {
    const reminders = await Reminder.find();
    const medications = await Medication.find();
    
    const allItems = [
      ...reminders.map(r => ({ ...r.toObject(), dateKey: r.reminder_date || new Date().toISOString().slice(0, 10), medName: r.medication_name })),
      ...medications.map(m => ({ ...m.toObject(), dateKey: m.startDate ? new Date(m.startDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10), medName: m.name }))
    ];

    const reportData = {
      summary: {
        totalDoses: allItems.length,
        taken: allItems.filter(i => i.status === "taken").length,
        missed: allItems.filter(i => i.status === "missed").length,
        pending: allItems.filter(i => i.status === "pending").length,
      },
      patterns: {
        mostMissedMed: "",
        missedDays: {}, 
      },
      history: allItems.sort((a,b) => b.dateKey.localeCompare(a.dateKey)).slice(0, 20)
    };

    let maxMissed = 0;
    const medMissedCounts = {};
    
    allItems.filter(i => i.status === "missed").forEach(i => {
      const name = i.medName;
      if (!name) return;
      medMissedCounts[name] = (medMissedCounts[name] || 0) + 1;
      if (medMissedCounts[name] > maxMissed) {
        maxMissed = medMissedCounts[name];
        reportData.patterns.mostMissedMed = name;
      }

      const day = new Date(i.dateKey).toLocaleDateString("en-US", { weekday: 'long' });
      reportData.patterns.missedDays[day] = (reportData.patterns.missedDays[day] || 0) + 1;
    });

    res.json(reportData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
