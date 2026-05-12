import React, { useState, useEffect, useRef, useContext } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import { FaCheck, FaTimes, FaClock, FaCapsules, FaBullhorn, FaFlask,FaCalendarAlt } from "react-icons/fa";
import { SettingsContext } from "./SettingsContext";
import "../styles/NotifyMe.css";

const NotifyMe = () => {
  const { language, t } = useContext(SettingsContext);
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString(language === "ta" ? "ta-IN" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const [reminders, setReminders] = useState([]);
  const [medications, setMedications] = useState([]);
  const [loadingId, setLoadingId] = useState(null);

  const remindersRef = useRef([]);
  const medicationsRef = useRef([]);

  // ── FETCH ─────────────────────────────────────────────────────────
  const fetchAll = async () => {
    try {
      const [remRes, medRes] = await Promise.all([
        api.get("/reminders"),
        api.get("/medications"),
      ]);

      const fmtReminders = remRes.data.map((r) => ({
        id: r._id,
        ...r,
        reminder_date: r.reminder_date || "—",
        reminder_time: r.reminder_time || "—",
      }));
      const fmtMeds = medRes.data.map((m) => {
        const defaultPrompt = `Time to take your medication: ${m.name}, ${m.dose}`;
        return {
          id: m._id,
          medication_name: m.name,
          // Medication model uses startDate — format it to a readable string
          reminder_date: m.startDate
            ? new Date(m.startDate).toLocaleDateString(language === "ta" ? "ta-IN" : "en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : m.reminder_date || m.date || "—",
          reminder_time: (m.scheduleTime || m.time || "—").trim(),
          reminder_type: "voice",
          voice_prompt: language === "ta" ? `${t("takeTime")}: ${m.name}, ${m.dose}` : defaultPrompt,
          status: m.status || "pending",
          source: "medication",
          startDate: m.startDate,
        };
      });

      remindersRef.current = fmtReminders;
      medicationsRef.current = fmtMeds;
      setReminders(fmtReminders);
      setMedications(fmtMeds);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, []);

  // ── STATUS UPDATE ────────────────────────────────────────────────
  const updateStatus = async (id, action) => {
    try {
      setLoadingId(id);
      const res = await api.put(`/reminders/${id}`, { action });
      const up = { ...res.data, id: res.data._id };
      setReminders((prev) => prev.map((r) => (r.id === id ? up : r)));
      remindersRef.current = remindersRef.current.map((r) => (r.id === id ? up : r));
    } catch (err) {
      console.error("Update Error:", err);
    } finally {
      setLoadingId(null);
    }
  };

  const handleTaken = (id) => updateStatus(id, "taken");
  const handleSkip = async (id) => {
    await updateStatus(id, "missed");
    navigate("/missed-doses");
  };

  const allAlerts = [...reminders, ...medications].sort((a, b) => {
    // 1. Get raw dates for sorting
    // For reminders: reminder_date is YYYY-MM-DD
    // For medications: m.startDate is used
    const getRawDate = (item) => {
      if (item.source === "medication") {
        const start = new Date(item.startDate || Date.now());
        const now = new Date();
        now.setHours(0,0,0,0);
        return start < now ? now : start; 
      }
      if (item.reminder_date && item.reminder_date.includes("-")) {
        const [y, m, d] = item.reminder_date.split("-").map(Number);
        return new Date(y, m - 1, d);
      }
      return new Date(item.reminder_date || Date.now());
    };

    const dateA = getRawDate(a);
    const dateB = getRawDate(b);

    if (dateB.getTime() !== dateA.getTime()) {
      return dateB - dateA;
    }

    // 2. Same date, sort by time (descending)
    return (b.reminder_time || "00:00").localeCompare(a.reminder_time || "00:00");
  });

  // ── UI ────────────────────────────────────────────────────────────
  return (
    <div className="notify-me-wrapper">
      <div className="alerts-container">
        {/* Header */}
        <div className="alerts-header-group">
          <h2 className="alerts-title"> {t("medicationAlerts")} </h2>
          <p className="current-date">{today}</p>
        </div>

        {allAlerts.length === 0 ? (
          <div className="no-alerts">
            <p>{t("noActiveAlerts")}</p>
            <p className="no-alerts-hint">{t("addReminderHint")}</p>
          </div>
        ) : (
          allAlerts.map((r) => (
            <div key={`${r.id}-${r.source || "rem"}`} className={`alert-card ${r.status}`}>
              <div className="alert-header">
                {r.source === "medication" ? (
                  <FaFlask className="alert-icon med-icon" />
                ) : (
                  <FaCapsules className="alert-icon" />
                )}
                <h3>{r.medication_name}</h3>
                {r.source === "medication" && (
                  <span className="med-badge">{t("medication_label") || "Medication"}</span>
                )}
              </div>

              <div className="alert-info">
                <div className="info-item">
                  <FaCalendarAlt />
                  <span>
                    {(() => {
                      let dateObj;
                      if (r.reminder_date && r.reminder_date.includes("-")) {
                        const [y, m, d] = r.reminder_date.split("-").map(Number);
                        dateObj = new Date(y, m - 1, d);
                      } else {
                        dateObj = new Date(r.reminder_date);
                      }

                      if (r.source === "medication" && r.startDate) {
                         const s = new Date(r.startDate);
                         if (s.toDateString() === new Date().toDateString()) return t("today");
                         if (s < new Date()) return t("today");
                         return r.reminder_date;
                      }

                      if (isNaN(dateObj.getTime())) return r.reminder_date;

                      if (dateObj.toDateString() === new Date().toDateString()) return t("today");
                      const yest = new Date();
                      yest.setDate(yest.getDate() - 1);
                      if (dateObj.toDateString() === yest.toDateString()) return t("yesterday");
                      return r.reminder_date;
                    })()}
                  </span>
                </div>
                <div className="info-item">
                  <FaClock />
                  <span>{r.reminder_time || "—"}</span>
                </div>
                <div className="info-item">
                  <FaBullhorn />
                  <span>
                    {r.reminder_type === "voice" ? `🔊 ${t("voiceOption")}` : `🔔 ${t("pushOption")}`}
                  </span>
                </div>
                {r.voice_prompt && (
                  <div className="info-item voice-prompt-preview">
                    <span>🎙️ "
                      {(() => {
                        const msg = r.voice_prompt || "";
                        const lowerMsg = msg.toLowerCase();
                        const isDefaultEnglish = 
                          lowerMsg.includes("time to take") || 
                          lowerMsg.includes("medication reminder") || 
                          lowerMsg.includes("take your medication");
                        
                        if (language === "ta" && isDefaultEnglish) {
                          return `${t("takeTime")}: ${r.medication_name}`;
                        }
                        return msg;
                      })()}
                    "</span>
                  </div>
                )}
              </div>

              <div className="alert-status">
                <span className={`status-badge ${r.status}`}>
                  {r.status === "pending" && t("pendingStatus")}
                  {r.status === "taken" && t("takenStatus")}
                  {r.status === "missed" && t("missedStatus")}
                </span>
              </div>

              {/* Actions — only for reminders, not medication read-only rows */}
              {!r.source && (
                <div className="alert-actions">
                  <button
                    className="taken-btn"
                    disabled={r.status === "taken" || loadingId === r.id}
                    onClick={() => handleTaken(r.id)}
                  >
                    <FaCheck /> {t("takenBtn")}
                  </button>
                  <button
                    className="skip-btn"
                    disabled={r.status !== "pending" || loadingId === r.id}
                    onClick={() => handleSkip(r.id)}
                  >
                    <FaTimes /> {t("skipBtn")}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotifyMe;