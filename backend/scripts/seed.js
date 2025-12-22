import dotenv from "dotenv";
import connectDB from "../config/db.js";
import Admin from "../models/Admin.js";
import User from "../models/User.js";
import Medication from "../models/Medication.js";
import Reminder from "../models/Reminder.js";
import Analytics from "../models/Analytics.js";
import RefillReminder from "../models/RefillReminder.js";
import VoiceNote from "../models/VoiceNote.js";
import Setting from "../models/Setting.js";
import MissedDose from "../models/MissedDose.js";

dotenv.config();
connectDB();

const seedData = async () => {
  try {
    console.log("🌱 Seeding data...");

    // ===== Admin =====
    const newAdmin = { fullName: "MediTrack Admin", email: "meditrack.admin@gmail.com", password: "admin123" };
    const existingAdmin = await Admin.findOne({ email: newAdmin.email });
    if (!existingAdmin) await Admin.create(newAdmin);

    // ===== User =====
    const newUser = {
      fullName: "Mala",
      email: "mala@gmail.com",
      password: "mala2010",
      language: "en",
      accessibility_setting: { fontSize: "medium", theme: "light", screenReader: false, contrast: "normal" }
    };
    let createdUser = await User.findOne({ email: newUser.email });
    if (!createdUser) createdUser = await User.create(newUser);

    // ===== Medication & Related Data =====
    const medications = [
      { name: "Panadol", dose: "100mg", schedule_time: "09:00", frequency: "daily", category: "Painkiller", notes: "Take after breakfast" },
      { name: "Vitamin C", dose: "500mg", schedule_time: "12:00", frequency: "daily", category: "Supplement", notes: "Take with lunch" },
      { name: "Aspirin", dose: "75mg", schedule_time: "20:00", frequency: "daily", category: "Cardiac", notes: "Take after dinner" }
    ];

    for (const med of medications) {
      let createdMed = await Medication.findOne({ user_id: createdUser._id, name: med.name });
      if (!createdMed) createdMed = await Medication.create({ ...med, user_id: createdUser._id });

      // ===== Reminder =====
      const existingReminder = await Reminder.findOne({ user_id: createdUser._id, medication_id: createdMed._id });
      if (!existingReminder) await Reminder.create({ user_id: createdUser._id, medication_id: createdMed._id, reminder_time: createdMed.schedule_time, reminder_type: "push", status: "pending" });

      // ===== Refill Reminder =====
      const existingRefill = await RefillReminder.findOne({ medication: createdMed._id });
      if (!existingRefill) await RefillReminder.create({ medication: createdMed._id, remaining_pills: 10, threshold: 5, reminder_date: new Date(new Date().setDate(new Date().getDate() + 7)) });

      // ===== Voice Note =====
      const existingVoiceNote = await VoiceNote.findOne({ user: createdUser._id, medication: createdMed._id });
      if (!existingVoiceNote) await VoiceNote.create({ user: createdUser._id, medication: createdMed._id, audio_url: "https://example.com/audio/sample.mp3", transcription: `Take one ${med.name} as prescribed` });

      // ===== Missed Dose =====
      const existingMissed = await MissedDose.findOne({ user_id: createdUser._id, medication_name: createdMed.name });
      if (!existingMissed) {
        await MissedDose.create({
          user_id: createdUser._id,
          medication_name: createdMed.name,
          dose_amount: createdMed.dose,
          scheduled_time: new Date(new Date().setHours(8)), // example: 8 AM
          status: "missed",
          missed_reason: "User forgot",
          notification_sent: false
        });
      }
    }

    // ===== Analytics =====
    const existingAnalytics = await Analytics.findOne({ user: createdUser._id });
    if (!existingAnalytics) await Analytics.create({ user: createdUser._id, adherence_rate: 90, missed_doses: 2, refill_count: medications.length, prediction_score: 0.25 });

    // ===== Setting =====
    const existingSetting = await Setting.findOne({ user: createdUser._id });
    if (!existingSetting) await Setting.create({ user: createdUser._id, notification_preferences: { push: true, sms: false, voice: true } });

    console.log("✅ Seeding complete!");
  } catch (error) {
    console.error("❌ Seeding error:", error);
  } finally {
    process.exit();
  }
};

seedData();

