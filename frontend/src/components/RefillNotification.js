import React, { useEffect, useState, useRef, useContext } from "react";
import api from "../utils/api";
import { FaCapsules, FaBell, FaCalendarAlt, FaHashtag, FaExclamationCircle } from "react-icons/fa";
import { SettingsContext } from "./SettingsContext";
import "../styles/RefillNotification.css";

const RefillNotification = () => {
  const { language, t } = useContext(SettingsContext);
  const [refills, setRefills]   = useState([]);
  const [messages, setMessages] = useState([]);
  const [remainingPills, setRemainingPills] = useState("");
  const [threshold, setThreshold]           = useState("");
  const [reminderDate, setReminderDate]     = useState("");
  const [loading, setLoading]   = useState(true);

  const alertedRef = useRef(new Set()); // prevent duplicate alerts

  // ── Push notification helper ─────────────────────────────────────
  const sendPush = (title, body) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
  };

  // ── AI Voice helper ──────────────────────────────────────────────
  const speakVoice = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    const voices = window.speechSynthesis.getVoices();
    const segments = text.split(/[,:]/);
    const queue = [];

    segments.forEach((segment) => {
      const cleanSegment = segment.trim();
      if (!cleanSegment) return;
      const u = new SpeechSynthesisUtterance(cleanSegment);
      const isTamil = /[\u0B80-\u0BFF]/.test(cleanSegment);//Natural Language Processing (NLP – basic level)

      if (isTamil) {
        const taVoice = voices.find(v => v.name.includes("Google") && v.lang.startsWith("ta")) ||
                        voices.find(v => v.name.includes("Valluvar")) ||
                        voices.find(v => v.lang.toLowerCase().includes("ta"));
        if (taVoice) { u.voice = taVoice; u.lang = taVoice.lang; } else { u.lang = "ta-IN"; }
      } else {
        const enVoice = voices.find(v => v.lang.toLowerCase().includes("en"));
        if (enVoice) { u.voice = enVoice; u.lang = enVoice.lang; } else { u.lang = "en-US"; }
      }

      u.rate = isTamil ? 0.8 : 0.9;
      queue.push(u);
    });

    const playNext = (index) => {
      if (index >= queue.length) return;
      const currU = queue[index];
      currU.onend = () => setTimeout(() => playNext(index + 1), 200);
      window.speechSynthesis.speak(currU);
    };
    if (queue.length > 0) playNext(0);
  };

  // ── Fetch refills from backend ───────────────────────────────────
  useEffect(() => {
    const fetchRefills = async () => {
      try {
        const res = await api.get("/refills");
        setRefills(res.data);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRefills();
    const interval = setInterval(fetchRefills, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  // ── Request push permission ──────────────────────────────────────
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // ── Pill-count checker (Date based is handled by GlobalNotification) ──
  useEffect(() => {
    const interval = setInterval(() => {
      refills.forEach((med) => {
        // Pill count alert only
        const pillsLow  = med.remaining_pills <= (med.threshold || 3);
        const pillKey   = `pills-${med._id}`;

        if (pillsLow && !alertedRef.current.has(pillKey)) {
          alertedRef.current.add(pillKey);
          
          // Localized message construction
          const msg = language === "ta" 
            ? `${t("refillAlert")}: ${med.medication_name}, ${t("lowPills")}`
            : `Refill Alert: ${med.medication_name} is running low on pills`;

          setMessages((prev) => [{ id: Date.now(), text: msg, type: "low" }, ...prev]);
          // sendPush(t("refillNotifTitle"), msg); // Handled by GlobalNotification
          // speakVoice(msg); // Handled by GlobalNotification
        }
      });
    }, 45000); 

    return () => clearInterval(interval);
  }, [refills, language, t]);

  // ── UI ───────────────────────────────────────────────────────────
  return (
    <div className="refill-notif-wrapper">
      <div className="refill-notif-container">
        <h2 className="page-title">
          <FaBell className="title-icon" /> {t("refillNotifTitle") || "Refill Notifications"}
        </h2>

        {/* Active alerts */}
        {messages.length > 0 && (
          <div className="alerts-section">
            <h3 className="section-title">{t("activeAlerts") || "🔔 Active Alerts"}</h3>
            {messages.map((m) => (
              <div key={m.id} className="alert-toast">
                <FaExclamationCircle className="alert-icon" />
                <span>{m.text}</span>
              </div>
            ))}
          </div>
        )}

        <h3 className="section-title">{t("scheduledReminders") || "📋 Scheduled Reminders"}</h3>

        {loading ? (
          <div className="loading-spinner" />
        ) : refills.length > 0 ? (
          <div className="refill-grid">
            {refills.map((m) => (
              <div key={m._id} className={`refill-card-modern ${m.remaining_pills <= (m.threshold || 3) ? "low-stock" : ""}`}>
                <div className="card-accent" />
                <div className="card-content">
                  <div className="card-header">
                    <FaCapsules className="med-icon" />
                    <h3>{m.medication_name}</h3>
                    {m.remaining_pills <= (m.threshold || 3) && (
                      <span className="low-badge">⚠️ {t("lowPills") || "Low"}</span>
                    )}
                  </div>
                  <div className="card-body">
                    <div className="info-row">
                      <FaHashtag />
                      <span>{t("remaining") || "Remaining"}: <strong>{m.remaining_pills}</strong></span>
                    </div>
                    <div className="info-row">
                      <FaBell />
                      <span>{t("threshold") || "Threshold"}: <strong>{m.threshold}</strong></span>
                    </div>
                    <div className="info-row">
                      <FaCalendarAlt />
                      <span>{t("refillDateLabel") || "Refill Date"}: <strong>{m.reminder_date ? new Date(m.reminder_date).toLocaleDateString(language === "ta" ? "ta-IN" : "en-US") : "—"}</strong></span>
                    </div>
                    
                    <div className="refill-times-badge-grid">
                       {m.morning_time && <span className="time-badge">🌅 {m.morning_time}</span>}
                       {m.afternoon_time && <span className="time-badge">☀️ {m.afternoon_time}</span>}
                       {m.evening_time && <span className="time-badge">🌙 {m.evening_time}</span>}
                       
                            {/* //<div className="refill-times-badge-grid">
        <span className="time-badge">🌅 Morning: {m.morning_time || "8:00 AM"}</span>
        <span className="time-badge">☀️ Afternoon: {m.afternoon_time || "1:00 PM"}</span>
        <span className="time-badge">🌙 Evening: {m.evening_time || "8:00 PM"}</span>
      </div> */}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-data">
            <p>{t("noRefills") || "No refill reminders found. You're all set! ✨"}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RefillNotification;