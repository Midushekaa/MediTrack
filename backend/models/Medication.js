import mongoose from "mongoose";

const { Schema } = mongoose;

const MedicationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },

    name: { type: String, required: true },
    dose: { type: String, required: true },

    // FIXED FIELD NAME (IMPORTANT)
    scheduleTime: { type: String, required: true }, // "HH:mm"

    category: { type: String, required: true }, // breakfast/lunch/dinner

    frequency: { type: String },
    notes: { type: String },

    startDate: { type: Date, required: true },
    endDate: { type: Date },

    totalQuantity: { type: Number }, // e.g., 30
    dosagePerDay: { type: Number },  // e.g., 2

    status: {
      type: String,
      enum: ["pending", "taken", "missed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Medication", MedicationSchema);