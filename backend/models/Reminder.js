import mongoose from "mongoose";

const { Schema } = mongoose;

const ReminderSchema = new Schema({
  medication_id: { type: mongoose.Schema.Types.ObjectId, ref: "Medication", required: true },
  reminder_time: { type: String, required: true }, // "08:00"
  reminder_type: { type: String, enum: ["push", "voice", "SMS"], default: "push" },
  status: { type: String, enum: ["pending", "taken", "missed"], default: "pending" },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

ReminderSchema.pre("save", function(next) {
  this.updated_at = Date.now();
  next();
});

export default mongoose.model("Reminder", ReminderSchema);
