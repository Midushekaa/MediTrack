import mongoose from "mongoose";

const RefillSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    medication_name: { type: String, required: true },
    remaining_pills: { type: Number, required: false, default: 5 },
    threshold: { type: Number, required: false, default: 3 },
    reminder_date: { type: String, required: false }, // ISO string
  },
  { timestamps: true }
);

export default mongoose.model("RefillReminder", RefillSchema);