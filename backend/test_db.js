import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

mongoose.connect(process.env.MONGO_URL || "mongodb://127.0.0.1:27017/meditrack");

const reminderSchema = new mongoose.Schema({
    medication_name: String,
    status: String,
    reminder_date: String
}, { strict: false });

const Reminder = mongoose.model("Reminder", reminderSchema);

const Medication = mongoose.model("Medication", new mongoose.Schema({}, { strict: false }));

const run = async () => {
    const m = await Medication.find({});
    console.log("Medications:", m);
    process.exit(0);
};

run();
