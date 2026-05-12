import mongoose from "mongoose";

const moodSchema = new mongoose.Schema({
  user_id: { type: String, default: "default_user" },
  mood: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

const Mood = mongoose.model("Mood", moodSchema);
export default Mood;
