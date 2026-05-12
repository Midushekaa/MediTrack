import express from "express";
import MissedDose from "../models/MissedDose.js";

const router = express.Router();

// GET MISSED DOSES
router.get("/", async (req, res) => {
  try {
    const data = await MissedDose.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json(err);
  }
});

export default router;