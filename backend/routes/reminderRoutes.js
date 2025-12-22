import express from "express";
import Reminder from "../models/Reminder.js";
import { authUser } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authUser, async (req, res) => {
  const reminders = await Reminder.find()
    .populate({ path: "medication", match: { user: req.user._id } })
    .exec();

  res.json(reminders.filter(r => r.medication));
});

router.post("/:id/mark", authUser, async (req, res) => {
  const { status } = req.body;
  const reminder = await Reminder.findById(req.params.id).populate("medication");
  if (!reminder || String(reminder.medication.user) !== String(req.user._id)) return res.status(404).send();
  reminder.status = status;
  await reminder.save();
  res.json(reminder);
});

export default router;
