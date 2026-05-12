import React, { useState, useContext } from "react";
import api from "../utils/api";
import { FaCapsules, FaHashtag, FaBell, FaCalendarAlt, FaSave } from "react-icons/fa";
import { SettingsContext } from "./SettingsContext";
import "../styles/RefillReminder.css";

const RefillReminder = () => {
  const { t } = useContext(SettingsContext);

  const [medicationName, setMedicationName] = useState("");
  const [remainingPills, setRemainingPills] = useState(5);
  const [threshold, setThreshold] = useState(3);
  const [reminderDate, setReminderDate] = useState("");
  const [morningTime, setMorningTime] = useState("08:00");
  const [afternoonTime, setAfternoonTime] = useState("14:00");
  const [eveningTime, setEveningTime] = useState("20:00");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [medsList, setMedsList] = useState([]);
  const [selectedMedId, setSelectedMedId] = useState("");

  // Load meds for dropdown
  React.useEffect(() => {
    const fetchMeds = async () => {
      try {
        const res = await api.get("/medications");
        setMedsList(res.data);
      } catch (err) {
        console.error("Meds fetch failed", err);
      }
    };
    fetchMeds();
  }, []);

  // AUTO-LOGIC: When med is selected, predict values
  const handleMedSelect = (id) => {
    setSelectedMedId(id);
    const med = medsList.find(m => m._id === id);
    if (med) {
      setMedicationName(med.name);

      // LOGIC: Set defaults
      const remaining = med.totalQuantity || 5;
      setRemainingPills(remaining);
      setThreshold(3);

      // LOGIC: Predict refill date (when supply hits 0)
      const perDay = Number(med.dosagePerDay) || 1;
      const daysLeft = perDay > 0 ? Math.floor(remaining / perDay) : 0;
      const today = new Date();
      const predictedDate = new Date();
      predictedDate.setDate(today.getDate() + daysLeft);
      setReminderDate(predictedDate.toISOString().split("T")[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // ... rest of submit

    if (!medicationName.trim()) {
      setError(t("enterMedName") || "⚠️ Please enter medication name");
      setTimeout(() => setError(""), 2500);
      setLoading(false);
      return;
    }

    try {
      await api.post("/refills", {
        medication_name: medicationName,
        remaining_pills: Number(remainingPills),
        threshold: Number(threshold),
        reminder_date: reminderDate,
        morning_time: morningTime,
        afternoon_time: afternoonTime,
        evening_time: eveningTime,
        reminder_type: "voice",
      });

      setMessage(t("refillSaved") || `✅ Refill reminder for ${medicationName} saved.`);
      setTimeout(() => setMessage(""), 4000);
      setMedicationName("");
      setRemainingPills("");
      setThreshold("");
      setReminderDate("");
    } catch (err) {
      setError(err.response?.data?.message || t("refillFailed") || "❌ Failed to save reminder");
      setTimeout(() => setError(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="refill-page-wrapper">
      <div className="refill-card-glass">
        <div className="refill-header">
          <FaCapsules className="header-icon" />
          <h2 className="refill-title">{t("refillReminderTitle") || "Refill Reminder"}</h2>
        </div>

        {message && <div className="toast-msg success">{message}</div>}
        {error && <div className="toast-msg error">{error}</div>}

        <form onSubmit={handleSubmit} className="refill-modern-form">

          <div className="input-group-modern">
            <FaHashtag className="input-icon" />
            <select
              value={selectedMedId}
              onChange={(e) => handleMedSelect(e.target.value)}
              className="med-select-dropdown"
            >
              <option value="">{t("Select Medicine") || "--- Select Medication to Auto-Fill ---"}</option>
              {medsList.map(m => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div className="input-row">
            <div className="input-group-modern">
              <FaHashtag className="input-icon" />
              <input
                type="number"
                placeholder={t("remainingPillsPlaceholder") || "Remaining Pills"}
                value={remainingPills}
                onChange={(e) => setRemainingPills(e.target.value)}
              />
            </div>
            <div className="input-group-modern">
              <FaBell className="input-icon" />
              <input
                type="number"
                placeholder={t("thresholdPlaceholder") || "Alert Threshold"}
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
              />
            </div>
          </div>

          <div className="input-group-modern">
            <FaCalendarAlt className="input-icon" />
            <input
              type="date"
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
            />
          </div>

          <button type="submit" className="refill-submit-btn" disabled={loading}>
            <FaSave /> {loading ? (t("savingBtn") || "Saving...") : (t("saveReminderBtnRefill") || "Save Reminder")}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RefillReminder;