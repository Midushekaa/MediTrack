import express from "express";
import Medication from "../models/Medication.js";
import { authUser } from "../middleware/auth.js";

const router = express.Router();

// =====================
// GET ALL MEDICATIONS
// =====================
router.get("/", authUser, async (req, res) => {
  try {
    const meds = await Medication.find({ user: req.user._id });
    res.json(meds);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =====================
// CREATE MEDICATION
// =====================
router.post("/", authUser, async (req, res) => {
  try {
    const med = await Medication.create({
      user: req.user._id,
      ...req.body,
    });

    res.status(201).json(med);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =====================
// GET SINGLE MEDICATION
// =====================
router.get("/:id", authUser, async (req, res) => {
  console.log("FETCHING SINGLE MED:", req.params.id);
  try {
    const medId = req.params.id;
    if (!medId || medId === "undefined") {
      return res.status(400).json({ message: "Valid ID is required" });
    }
    
    const med = await Medication.findById(medId.trim());
    
    if (!med) {
      console.log(`Medication ${medId} not found in DB`);
      return res.status(404).json({ message: "Medication not found in database" });
    }

    if (med.user.toString() !== req.user._id.toString()) {
      console.log(`User ${req.user._id} does not own medication ${medId}`);
      return res.status(403).json({ message: "Not authorized to view this medication" });
    }

    res.json(med);
  } catch (err) {
    console.error("GET MED ERROR:", err);
    res.status(500).json({ message: "Invalid ID or server error" });
  }
});

// =====================
// UPDATE MEDICATION
// =====================
router.put("/:id", authUser, async (req, res) => {
  try {
    const updated = await Medication.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =====================
// SNOOZE MEDICATION
// =====================
router.post("/:id/snooze", authUser, async (req, res) => {
  try {
    const med = await Medication.findById(req.params.id);
    if (!med) return res.status(404).json({ message: "Medication not found" });

    // Add 15 minutes to the current scheduleTime
    const [h, m] = med.scheduleTime.split(":").map(Number);
    let newM = m + 15;
    let newH = h;
    
    if (newM >= 60) {
      newM -= 60;
      newH = (newH + 1) % 24;
    }
    
    const newTime = `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
    med.scheduleTime = newTime;
    await med.save();
    
    return res.json(med);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// =====================
// DELETE MEDICATION
// =====================
router.delete("/:id", authUser, async (req, res) => {
  try {
    await Medication.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;