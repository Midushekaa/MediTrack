import mongoose from "mongoose";

const missedDoseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    medication_name: { type: String, required: true },
    dose_amount: { type: String, required: true },
    scheduled_time: { type: String, required: true },
    actual_time: { type: Date, default: null },

    status: {
      type: String,
      enum: ["missed", "late", "skipped", "rescheduled"],
      default: "missed",
    },

    missed_reason: { type: String, default: "" },
    notification_sent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("MissedDose", missedDoseSchema);