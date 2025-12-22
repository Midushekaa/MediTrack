import mongoose from "mongoose";

const { Schema } = mongoose;

const VoiceNoteSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  medication: { type: Schema.Types.ObjectId, ref: "Medication", required: true },
  audio_url: { type: String, required: true },
  transcription: { type: String },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model("VoiceNote", VoiceNoteSchema);
