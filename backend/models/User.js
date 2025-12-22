import mongoose from "mongoose";

const { Schema } = mongoose;

// Accessibility Settings (embedded schema)
const AccessibilitySchema = new Schema({
  fontSize: { type: String, default: "medium" },
  colorScheme: { type: String, default: "default" },
  screenReader: { type: Boolean, default: false }
}, { _id: false });

// User Schema
const UserSchema = new Schema({
  fullName: { type: String, required: true },
  email: { type: String, unique: true, required: true, lowercase: true },
  password: { type: String, required: true },
  language: { type: String, default: "en" },

  // Use embedded schema instead of raw Object
  accessibility_setting: { 
    type: AccessibilitySchema,
    default: {}
  }
}, 
{ timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.model("User", UserSchema);
