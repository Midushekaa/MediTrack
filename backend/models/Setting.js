import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const SettingSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', unique: true },
  notification_preferences: {
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
    voice: { type: Boolean, default: true }
  }
}, { timestamps: true });

export default mongoose.model('Setting', SettingSchema);
