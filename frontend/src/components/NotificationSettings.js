import React, { useState, useEffect, useContext } from "react";
import api from "../utils/api";
import { SettingsContext } from "./SettingsContext";
import "../styles/notificationSettings.css";

const NotificationSettings = () => {
  const { language, t } = useContext(SettingsContext);

  const [medName, setMedName] = useState("");
  const [doseTime, setDoseTime] = useState("");
  // Default to today's date (YYYY-MM-DD) so the field is never blank
  const [doseDate, setDoseDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [channel, setChannel] = useState("push");
  const [voicePrompt, setVoicePrompt] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [permissionStatus, setPermissionStatus] = useState("default");

  // ── Request push permission on mount ──────────────────────────────
  useEffect(() => {
    if ("Notification" in window) {
      setPermissionStatus(Notification.permission);
      if (Notification.permission === "default") {
        Notification.requestPermission().then(status => setPermissionStatus(status));
      }
    }
  }, []);

  // ── Auto-fill a sensible default voice prompt ──────────────────────
  useEffect(() => {
    if (channel === "voice" && medName && !voicePrompt) {
      setVoicePrompt(`Time to take your medication: ${medName}`);
    }
  }, [channel, medName]);

  // ── Save reminder to backend ───────────────────────────────────────
  const handleSave = async () => {
    if (!medName || !doseTime || !doseDate) {
      setError(t("fillAllFieldsError") || "Please fill Medication Name, Reminder Date and Time");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (channel === "voice" && !voicePrompt.trim()) {
      setError("Please enter a custom AI Voice Prompt message.");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      const reminderData = {
        medication_name: medName,
        reminder_time: doseTime,
        reminder_date: doseDate,
        reminder_type: channel,
        voice_prompt: voicePrompt.trim() || `Time to take your medication: ${medName}`,
      };

      await api.post("/reminders", reminderData);

      const triggerMethod = channel === "push" ? "Push Notification" : "AI Voice Prompt";
      const creativeMessage = `Success! 🚀 Your ${medName} reminder is set for ${doseTime}. We will notify you via ${triggerMethod}. Stay healthy! 🔔`;
      
      setMessage(creativeMessage);
      setTimeout(() => setMessage(""), 6000);

      // Reset form — keep date defaulted to today
      setMedName("");
      setDoseTime("");
      setDoseDate(new Date().toISOString().slice(0, 10));
      setVoicePrompt("");
      setChannel("push");
    } catch (err) {
      console.error(err);
      setError(t("refillFailed") || "❌ Failed to save reminder");
      setTimeout(() => setError(""), 3000);
    }
  };

  // ── Test push notification ─────────────────────────────────────────
  const handleTestNotification = () => {
    if (!("Notification" in window)) {
      setError("This browser does not support desktop notifications.");
      return;
    }

    if (Notification.permission === "granted") {
      new Notification("🔔 Meditrack Test", {
        body: "Push notifications are working perfectly!",
        icon: "https://cdn-icons-png.flaticon.com/512/4144/4144781.png",
      });
      setMessage("Test notification sent! Check your desktop.");
    } else {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("🔔 Meditrack Test", {
            body: "Permission granted! Push notifications are now enabled.",
          });
          setMessage("Permission granted and test sent!");
        } else {
          setError("Notification permission denied. Please enable it in browser settings.");
        }
      });
    }
    setTimeout(() => { setMessage(""); setError(""); }, 4000);
  };

  return (
    <div className="notification-settings-wrapper">
      <div className="settings-card">
        <h2>{t("notifPageTitle") || "🔔 AI Notifications & Reminders"}</h2>

        {message && <div className="success-toast" style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>{message}</div>}
        {error && <div className="error-toast">{error}</div>}

        {/* Permission Warning */}
        {permissionStatus === "denied" && (
          <div className="permission-denied-box">
            <p><strong>⚠️ Notifications Blocked</strong></p>
            <p>To receive push alerts, click the <strong>tune/lock icon</strong> 🔒 in your browser's address bar and set Notifications to <strong>Allow</strong>.</p>
          </div>
        )}

        {/* Medication Name */}
        <div className="input-group">
          <label>{t("medNameField") || "Medication Name"}</label>
          <input
            type="text"
            placeholder="e.g. Paracetamol"
            value={medName}
            onChange={(e) => setMedName(e.target.value)}
          />
        </div>

        {/* Reminder Time */}
        <div className="input-group">
          <label>{t("reminderTimeField") || "Reminder Time"}</label>
          <input
            type="time"
            value={doseTime}
            onChange={(e) => setDoseTime(e.target.value)}
          />
        </div>

        {/* Reminder Date */}
        <div className="input-group">
          <label>{t("reminderDateLabel") || "Reminder Date"}</label>
          <input
            type="date"
            value={doseDate}
            onChange={(e) => setDoseDate(e.target.value)}
          />
        </div>

        {/* Notification Channel */}
        <div className="input-group">
          <label>{t("channelField") || "Notification Channel"}</label>
          <select value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="push">{t("pushOption") || "🔔 Push Notification"}</option>
            <option value="voice">{t("voiceOption") || "🔊 AI Voice Prompt"}</option>
          </select>
        </div>

        <div className="button-group" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="save-settings-btn" onClick={handleSave} style={{ flex: '2' }}>
            {t("saveReminderBtn") || "💾 Save Reminder"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;