import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    medication_name: { type: String, required: true },
    reminder_time: { type: String, required: true }, // HH:mm
    reminder_date: { type: String, required: true }, // YYYY-MM-DD
    reminder_type: { type: String, default: "push" },
    voice_prompt: { type: String, default: "" }, // Custom AI voice message

    status: {
      type: String,
      enum: ["pending", "taken", "missed"],
      default: "pending",
    },

    takenTime: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Reminder", reminderSchema);