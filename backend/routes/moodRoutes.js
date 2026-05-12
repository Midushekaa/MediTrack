import express from "express";
import Mood from "../models/Mood.js";

const router = express.Router();

// Log a mood
router.post("/", async (req, res) => {
  try {
    const { mood, user_id } = req.body;
    const newMood = new Mood({ mood, user_id });
    await newMood.save();
    res.status(201).json({ message: "Mood logged successfully", data: newMood });
  } catch (err) {
    res.status(500).json({ error: "Failed to log mood" });
  }
});

// Get recent moods
router.get("/", async (req, res) => {
  try {
    const moods = await Mood.find().sort({ date: -1 }).limit(10);
    res.json(moods);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch moods" });
  }
});

export default router;
