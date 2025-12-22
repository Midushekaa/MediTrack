import mongoose from "mongoose";

const { Schema } = mongoose;

const RefillSchema = new Schema({
  medication: { type: Schema.Types.ObjectId, ref: "Medication", required: true },
  remaining_pills: { type: Number, required: true },
  threshold: { type: Number, default: 5 },
  reminder_date: { type: Date },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model("RefillReminder", RefillSchema);
