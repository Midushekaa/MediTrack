const express = require('express');
const router = express.Router();
const Medication = require('../models/Medication');
const Reminder = require('../models/Reminder');
const { authUser } = require('../middleware/auth');

// create medication and default reminder(s)
router.post('/', authUser, async (req, res) => {
  try {
    const { name, dose, scheduleTime, frequency, category, notes } = req.body;

    if (!name || !dose || !scheduleTime) {
      return res.status(400).json({ message: 'Name, dose, and scheduleTime are required' });
    }

    const med = await Medication.create({
      user: req.user._id,
      name,
      dose,
      scheduleTime,
      frequency,
      category,
      notes
    });

    // create a default reminder
    const nextReminder = new Date();
    const [hh, mm] = scheduleTime.split(':').map(Number);
    nextReminder.setHours(hh, mm, 0, 0);
    if (nextReminder < new Date()) nextReminder.setDate(nextReminder.getDate() + 1);

    await Reminder.create({
      medication: med._id,
      reminder_time: nextReminder,
      reminder_type: 'push'
    });

    res.status(201).json(med);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create medication' });
  }
});

// get medications
router.get('/', authUser, async (req, res) => {
  try {
    const meds = await Medication.find({ user: req.user._id });
    res.json(meds);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch medications' });
  }
});

module.exports = router;
