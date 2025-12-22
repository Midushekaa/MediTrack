import mongoose from "mongoose";

const { Schema } = mongoose;

const MedicationSchema = new Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // foreign key to User
  name: { type: String, required: true }, // medication name
  dose: { type: String, default: "" }, // e.g., 500mg
  schedule_time: { type: String, default: "08:00" }, // default time
  frequency: { type: String, enum: ["daily", "twice a day", "weekly"], default: "daily" },
  category: { type: String, default: "" }, // type/category
  notes: { type: String, default: "" }, // user notes
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
});

// Update timestamp before saving
MedicationSchema.pre("save", function(next) {
  this.updated_at = Date.now();
  next();
});

// Default export
export default mongoose.model("Medication", MedicationSchema);
