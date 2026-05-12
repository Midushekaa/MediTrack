import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
  action: { type: String, required: true },
  user: { type: String, required: true }, // Name or Email of the actor or subject
  details: { type: String },
  status: { type: String, enum: ["Success", "Warning", "Error"], default: "Success" },
  createdAt: { type: Date, default: Date.now }
});

const Activity = mongoose.model("Activity", activitySchema);
export default Activity;
