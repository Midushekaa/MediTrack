import mongoose from "mongoose";

const { Schema } = mongoose;

const AnalyticsSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  adherence_rate: { type: Number, default: 100 },
  missed_doses: { type: Number, default: 0 },
  refill_count: { type: Number, default: 0 },
  prediction_score: { type: Number, default: 0 }, // probability [0-1]
  updated_at: { type: Date, default: Date.now }
});

export default mongoose.model("Analytics", AnalyticsSchema);
