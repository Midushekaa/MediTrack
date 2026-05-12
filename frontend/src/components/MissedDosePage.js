import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../utils/api";
import { FaCapsules, FaClock, FaCheck, FaExclamationTriangle, FaHistory, FaCalendarAlt, FaRedoAlt } from "react-icons/fa";
import { SettingsContext } from "./SettingsContext";
import "../styles/MissedDosePage.css";

const MissedDosePage = () => {
  const { t } = useContext(SettingsContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [missedDoses, setMissedDoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rescheduleId, setRescheduleId] = useState(null);   // card showing picker
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  const fetchMissedDoses = async () => {
    try {
      const [remRes, medRes] = await Promise.all([
        api.get("/reminders"),
        api.get("/medications"),
      ]);

      const todayStr = new Date().toISOString().slice(0, 10);
      const yestDate = new Date();
      yestDate.setDate(yestDate.getDate() - 1);
      const yestStr = yestDate.toISOString().slice(0, 10);

      const todayDateStr = new Date().toDateString();
      const yestDateStr = yestDate.toDateString();

      const missedReminders = remRes.data
        .filter((item) => {
          if (item.status !== "missed") return false;
          // Show today's and yesterday's missed reminders
          return item.reminder_date === todayStr || item.reminder_date === yestStr;
        })
        .map((r) => ({ ...r, source: "reminder", medication_name: r.medication_name }));

      const missedMeds = medRes.data
        .filter((item) => {
          if (item.status !== "missed") return false;
          // For medications, check if it was updated TODAY or YESTERDAY
          const updated = new Date(item.updatedAt || Date.now());
          return updated.toDateString() === todayDateStr || updated.toDateString() === yestDateStr;
        })
        .map((m) => ({
          ...m,
          source: "medication",
          medication_name: m.name,
          reminder_date: m.startDate ? new Date(m.startDate).toISOString().slice(0, 10) : "",
          reminder_time: m.scheduleTime || m.time,
        }));

      const sorted = [...missedReminders, ...missedMeds].sort((a, b) => {
        // Sort by date descending (Today first)
        const dateA = new Date(a.reminder_date || 0);
        const dateB = new Date(b.reminder_date || 0);
        if (dateB - dateA !== 0) return dateB - dateA;

        // Sort by time descending (Latest first)
        return (b.reminder_time || "00:00").localeCompare(a.reminder_time || "00:00");
      });

      setMissedDoses(sorted);
    } catch (err) {
      console.error("Error fetching missed doses:", err);
      setMissedDoses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissedDoses();
    const interval = setInterval(fetchMissedDoses, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle auto-reschedule from dashboard
  useEffect(() => {
    const highlightId = location.state?.highlightId;
    if (highlightId && missedDoses.length > 0) {
      const target = missedDoses.find((d) => d._id === highlightId);
      if (target && rescheduleId !== highlightId) {
        openReschedule(target);
      }
    }
  }, [location.state, missedDoses, rescheduleId]);

  const handleAction = async (dose, action) => {
    try {
      setActionLoading(dose._id);
      if (dose.source === "medication") {
        await api.put(`/medications/${dose._id}`, { status: action === "taken" ? "taken" : "missed" });
      } else {
        await api.put(`/reminders/${dose._id}`, { action });
      }
      // Navigate back to dashboard to see results
      navigate("/dashboard");
    } catch (err) {
      console.error("Action failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const openReschedule = (dose) => {
    setRescheduleId(dose._id);
    setNewDate(dose.reminder_date || new Date().toISOString().slice(0, 10));
    setNewTime(dose.reminder_time || "");
  };

  const handleReschedule = async (dose) => {
    if (!newDate || !newTime) return;
    try {
      setActionLoading(dose._id);
      if (dose.source === "medication") {
        await api.put(`/medications/${dose._id}`, {
          startDate: newDate,
          scheduleTime: newTime,
          status: "pending"
        });
      } else {
        await api.put(`/reminders/${dose._id}/reschedule`, {
          reminder_date: newDate,
          reminder_time: newTime,
        });
      }
      setRescheduleId(null);
      // Navigate back to dashboard to see updated time
      navigate("/dashboard");
    } catch (err) {
      console.error("Reschedule failed:", err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="app-background">
      <div className="missed-dose-container">
        <h2 className="missed-dose-title">
          <FaExclamationTriangle className="title-icon" /> {t("missedDosesBtn")}
        </h2>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>{t("loadingHistory")}</p>
          </div>
        ) : missedDoses.length === 0 ? (
          <div className="no-missed-doses">
            <FaCheck className="success-icon" />
            <p>{t("noMissedDoses")}</p>
          </div>
        ) : (
          <div className="missed-list">
            {missedDoses.map((dose) => (
              <div key={dose._id} className="missed-card">
                <div className="card-accent"></div>

                <div className="card-header">
                  <FaCapsules className="med-icon" />
                  <div className="med-details">
                    <h3>{dose.medication_name}</h3>
                    <p className="time-info">
                      <FaClock />
                      {dose.reminder_date ? ` ${dose.reminder_date}  ` : ""}
                      {dose.reminder_time || "—"}
                    </p>
                    <span className={`dose-status-badge ${dose.status}`}>
                      {dose.status === "missed" && t("missedStatus")}
                      {dose.status === "taken" && t("takenStatus")}
                      {dose.status === "pending" && t("pendingStatus")}
                    </span>
                  </div>
                </div>

                <div className="card-actions">
                  <button
                    className="take-now-btn"
                    disabled={actionLoading === dose._id}
                    onClick={() => handleAction(dose, "taken")}
                  >
                    {actionLoading === dose._id ? "..." : t("takeNowBtn")}
                  </button>

                  <button
                    className="reschedule-btn"
                    disabled={actionLoading === dose._id}
                    onClick={() =>
                      rescheduleId === dose._id
                        ? setRescheduleId(null)
                        : openReschedule(dose)
                    }
                  >
                    <FaRedoAlt /> {t("rescheduleBtnLabel")}
                  </button>

                  <button
                    className="ignore-btn"
                    disabled={actionLoading === dose._id}
                    onClick={() => handleAction(dose, "missed")}
                  >
                    {t("dismissBtn")}
                  </button>
                </div>

                {/* Inline reschedule picker */}
                {rescheduleId === dose._id && (
                  <div className="reschedule-panel">
                    <div className="reschedule-fields">
                      <div className="rfield">
                        <label>
                          <FaCalendarAlt /> {t("newDateLabel")}
                        </label>
                        <input
                          type="date"
                          value={newDate}
                          onChange={(e) => setNewDate(e.target.value)}
                        />
                      </div>
                      <div className="rfield">
                        <label>
                          <FaClock /> {t("newTimeLabel")}
                        </label>
                        <input
                          type="time"
                          value={newTime}
                          onChange={(e) => setNewTime(e.target.value)}
                        />
                      </div>
                    </div>
                    <button
                      className="confirm-reschedule-btn"
                      disabled={!newDate || !newTime || actionLoading === dose._id}
                      onClick={() => handleReschedule(dose)}
                    >
                      {actionLoading === dose._id ? "..." : t("confirmRescheduleBtn")}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MissedDosePage;
