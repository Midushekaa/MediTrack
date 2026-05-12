import React, { useState, useEffect, useContext } from "react";
import api from "../utils/api";
import "../styles/dashboard.css";
import { FaCamera, FaPills, FaClock, FaCheck, FaTimes, FaPlus, FaChartBar } from "react-icons/fa";
import { SettingsContext } from "./SettingsContext";
import { useNavigate } from "react-router-dom";
import { TEXT } from "../utils/locales";
import QRScanner from "./QRScanner";

function Dashboard() {
  const { language, fontSize } = useContext(SettingsContext);
  const navigate = useNavigate();

  const [userName, setUserName] = useState("User");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [medications, setMedications] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [nextDoseCountdown, setNextDoseCountdown] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  const t = TEXT[language] || TEXT.en;

  // LOAD USER
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) {
      setUserName(
        user.fullName ||   // ← User model field
        user.name ||
        user.email?.split("@")[0] ||
        "User"
      );
    }
  }, []);

  // FETCH MEDICATIONS + REMINDERS
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [medRes, remRes] = await Promise.all([
          api.get("/medications"),
          api.get("/reminders"),
        ]);
        const formatted = medRes.data.map((m) => ({
          ...m,
          date: new Date(m.startDate || m.date),
          time: m.scheduleTime || m.time || "",
        }));
        setMedications(formatted);
        setReminders(remRes.data);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };
    fetchData();
  }, []);

  const setYesterday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };

  const setToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const isYesterday = selectedDate.toDateString() === new Date(new Date().setDate(new Date().getDate() - 1)).toDateString();

  // MARK AS TAKEN
  const markAsTaken = async (id) => {
    try {
      const item = todayItems.find(i => i._id === id);
      if (item?.source === "reminder") {
        await api.put(`/reminders/${id}`, { action: "taken" });
        setReminders((prev) =>
          prev.map((r) => (r._id === id ? { ...r, status: "taken" } : r))
        );
      } else {
        await api.put(`/medications/${id}`, { status: "taken" });
        setMedications((prev) =>
          prev.map((m) => (m._id === id ? { ...m, status: "taken", updatedAt: new Date().toISOString() } : m))
        );
      }
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  // MARK AS SKIPPED
  const markAsSkipped = async (id) => {
    try {
      const item = todayItems.find(i => i._id === id);
      if (item?.source === "reminder") {
        await api.put(`/reminders/${id}`, { action: "missed" });
        setReminders((prev) =>
          prev.map((r) => (r._id === id ? { ...r, status: "missed" } : r))
        );
      } else {
        await api.put(`/medications/${id}`, { status: "missed" });
        setMedications((prev) =>
          prev.map((m) => (m._id === id ? { ...m, status: "missed", updatedAt: new Date().toISOString() } : m))
        );
      }
      navigate("/missed-doses");
    } catch (err) {
      console.error("Skip failed", err);
    }
  };

  // SNOOZE
  const handleSnooze = async (id) => {
    try {
      const res = await api.post(`/medications/${id}/snooze`);
      setMedications((prev) =>
        prev.map((m) =>
          m._id === id
            ? { ...m, scheduleTime: res.data.scheduleTime, time: res.data.scheduleTime }
            : m
        )
      );
      alert(t.snoozeAlert || "Reminder delayed by 15 minutes");
    } catch (err) {
      console.error("Snooze failed", err);
    }
  };

  // MOOD CHECK-IN
  const [moodMessage, setMoodMessage] = useState("");
  const handleMoodClick = async (moodLabel) => {
    try {
      await api.post("/moods", { mood: moodLabel });
      setMoodMessage(`${t.moodSaved || "Mood saved!"} ${moodLabel}`);
      setTimeout(() => setMoodMessage(""), 2000);
    } catch (err) {
      console.error("Mood save failed", err);
    }
  };

  // =========================
  // STATUS COLOR
  // =========================
  const getStatusColor = (status) => {
    if (status === "taken") return "green";
    if (status === "missed") return "red";
    return "gold";
  };

  // =========================
  // TODAY FILTER (Active medications + Reminders)
  // =========================
  const todayMeds = medications.filter((m) => {
    const start = new Date(m.startDate || m.date);
    const end = m.endDate ? new Date(m.endDate) : null;

    // Normalize dates to midnight for comparison
    const compareDate = new Date(selectedDate);
    compareDate.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    if (end) end.setHours(0, 0, 0, 0);

    return compareDate >= start && (!end || compareDate <= end);
  });

  const todayReminders = reminders.filter((r) => {
    const rDate = new Date(r.reminder_date);
    const compareDate = new Date(selectedDate);
    rDate.setHours(0, 0, 0, 0);
    compareDate.setHours(0, 0, 0, 0);
    return rDate.getTime() === compareDate.getTime();
  }).map(r => ({
    ...r,
    name: r.medication_name,
    time: r.reminder_time,
    source: "reminder"
  }));

  const todayItems = [...todayMeds, ...todayReminders].sort((a, b) => (a.time || "").localeCompare(b.time || ""));

  // Helper to check if a medication was acted upon TODAY
  const getDisplayStatus = React.useCallback((item) => {
    if (item.source === "reminder") return item.status;

    if (!item.status || item.status === "pending") return "pending";

    const updated = new Date(item.updatedAt || Date.now());
    const isUpdatedToday = updated.toDateString() === new Date().toDateString();

    if (isToday && !isUpdatedToday) return "pending";
    return item.status;
  }, [isToday]);

  // COUNTDOWN LOGIC
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();

      // Find next pending dose
      const pending = todayItems
        .filter(m => getDisplayStatus(m) !== "taken")
        .sort((a, b) => (a.time || "").localeCompare(b.time || ""));

      if (pending.length > 0) {
        const next = pending[0];
        const [h, m] = (next.time || "00:00").split(":");
        const target = new Date();
        target.setHours(parseInt(h), parseInt(m), 0, 0);

        const diff = target - now;
        if (diff > 0) {
          const hours = Math.floor(diff / 3600000);
          const mins = Math.floor((diff % 3600000) / 60000);
          setNextDoseCountdown(`${hours}h ${mins}m`);
        } else {
          setNextDoseCountdown(t.dueNow || "Due now!");
        }
      } else {
        setNextDoseCountdown("-- : --");
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [todayItems, t.dueNow, getDisplayStatus, isToday]);

  // GREETING
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t.greetingMorning;
    else if (hour < 18) return t.greetingAfternoon;
    else return t.greetingEvening;
  };

  // =========================
  // REFILL COUNT
  // =========================
  const [refillCount, setRefillCount] = useState(0);
  useEffect(() => {
    const fetchRefills = async () => {
      try {
        const res = await api.get("/refills");
        setRefillCount(res.data.length);
      } catch (err) {
        console.error("Refill fetch error:", err);
      }
    };
    fetchRefills();
  }, []);

  // =========================
  // 1. Daily Progress Ring Logic (Snapshot of today's total goal)
  const scheduledToday = todayItems.length;
  const takenToday = todayItems.filter(x => x.status === "taken").length;
  const dailyProgress = Math.round((takenToday / (scheduledToday || 1)) * 100);

  // 2. Adherence Rate Logic (Clinical score - Historical/Ever)
  const allMeds = medications;
  const allRems = reminders;

  const takenEver = allMeds.filter(x => x.status === "taken").length +
    allRems.filter(x => x.status === "taken").length;

  const missedEver = allMeds.filter(x => x.status === "missed" || x.status === "skipped").length +
    allRems.filter(x => x.status === "missed" || x.status === "skipped").length;

  const totalDecidedEver = (takenEver + missedEver) || 1;

  const adherence = Math.round((takenEver / totalDecidedEver) * 100);
  const missedCount = todayItems.filter(x => x.status === "missed" || x.status === "skipped").length;

  // Reminder-specific stats
  const totalReminders = reminders.length;
  const pendingReminders = reminders.filter((r) => r.status === "pending").length;
  const takenReminders = reminders.filter((r) => r.status === "taken").length;
  const voiceReminders = reminders.filter((r) => r.reminder_type === "voice").length;

  const fontMap = { small: "0.85rem", medium: "1rem", large: "1.2rem" };

  return (
    <div className="app-background">
      <div className="dashboard-container" style={{ fontSize: fontMap[fontSize] }}>

        <div className="dashboard-header">
          <div className="greeting-group">
            <h2>{`${getGreeting()}, ${userName} 👋`}</h2>
            <p>{selectedDate.toDateString()}</p>
          </div>

          <div className="date-selection">
            <button
              className={`date-btn ${isYesterday ? "active" : ""}`}
              onClick={setYesterday}
            >
              {t.yesterday}
            </button>
            <button
              className={`date-btn ${isToday ? "active" : ""}`}
              onClick={setToday}
            >
              {t.today}
            </button>
          </div>

          {/* Daily Progress Circle */}
          <div className="daily-progress-container">
            <div className="progress-circle-box">
              <svg viewBox="0 0 36 36" className="circular-chart blue">
                <path className="circle-bg"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path className="circle"
                  strokeDasharray={`${(todayMeds.filter(m => m.status === "taken").length / (todayMeds.length || 1)) * 100}, 100`}
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <text x="18" y="20.35" className="percentage">
                  {dailyProgress}%
                </text>
              </svg>
              <div className="progress-info">
                <h4>{isToday ? t.dailyProgress || "Daily Progress" : `${t.progress || "Progress"} (${selectedDate.toLocaleDateString()})`}</h4>
                <p>{todayItems.filter(m => m.status === "taken").length} of {todayItems.length} Doses</p>
              </div>
            </div>
          </div>
        </div>

        {/* COUNTDOWN */}
        {isToday && (
          <div className="countdown">
            <h3>{t.nextDose}</h3>
            <div className="countdown-timer">{nextDoseCountdown}</div>
          </div>
        )}

        {/* ACTIONS */}
        <div className="quick-actions">
          <button onClick={() => navigate("/add-medication")}>
            <FaPlus size={20} />
            <span>{t.addNewMed || "Add Med"}</span>
          </button>

          <button onClick={() => navigate("/analytics")}>
            <FaChartBar size={20} />
            <span>{t.analyticsBtn || "Analytics"}</span>
          </button>

          <button onClick={() => {
            const next = todayMeds.find(m => m.status !== "taken" && m.status !== "missed");
            if (next) handleSnooze(next._id);
            else alert(t.noMeds || "No pending doses to snooze!");
          }}>
            <FaClock size={20} />
            <span>{t.snooze}</span>
          </button>

          <button onClick={() => setShowScanner(true)}>
            <FaCamera size={20} />
            <span>{t.scan || "Scan QR"}</span>
          </button>
        </div>

        {/* HEALTH SUMMARY */}
        <div className="health-summary">

          {/* ── Medication Stats ── */}
          <div className="summary-section-label">💊 Medications</div>

          <div className="card summary-card scheduled">
            <div className="summary-icon">📅</div>
            <h4>{isToday ? t.scheduledToday : `${t.scheduledToday} (${selectedDate.toLocaleDateString()})`}</h4>
            <p>{scheduledToday}</p>
          </div>

          <div className="card summary-card adherence">
            <div className="summary-icon">🎯</div>
            <h4>{t.adherence}</h4>
            <p>{adherence}%</p>
          </div>

          <div className="card summary-card missed">
            <div className="summary-icon">❌</div>
            <h4>{t.missedDoses}</h4>
            <p>{missedCount}</p>
          </div>

          <div className="card summary-card refills">
            <div className="summary-icon">🔄</div>
            <h4>{t.upcomingRefills}</h4>
            <p>{refillCount}</p>
          </div>

          {/* ── Reminder / Notification Stats ── */}
          <div className="summary-section-label">🔔 Reminders &amp; Notifications</div>

          <div className="card summary-card total-rem">
            <div className="summary-icon">🔔</div>
            <h4>Total Reminders</h4>
            <p>{totalReminders}</p>
          </div>

          <div className="card summary-card pending-rem">
            <div className="summary-icon">⏳</div>
            <h4>Pending</h4>
            <p>{pendingReminders}</p>
          </div>

          <div className="card summary-card taken-rem">
            <div className="summary-icon">✅</div>
            <h4>Confirmed</h4>
            <p>{takenReminders}</p>
          </div>

          <div className="card summary-card voice-rem">
            <div className="summary-icon">🔊</div>
            <h4>AI Voice Alerts</h4>
            <p>{voiceReminders}</p>
          </div>

        </div>

        {/* MED LIST */}
        <div className="medication-timeline">
          {todayItems.length === 0 ? (
            <div className="no-meds-wrapper">
              <FaPills className="no-meds-icon" />
              <p>{t.noMeds}</p>
            </div>
          ) : (
            todayItems.map((med) => (
              <div
                key={med._id}
                className="med-item"
                style={{ borderLeft: `5px solid ${getStatusColor(med.status)}` }}
                onClick={() => {
                  if (med.status === "missed") {
                    navigate("/missed-doses", { state: { highlightId: med._id } });
                  } else {
                    navigate("/medication", { state: { med } });
                  }
                }}
              >
                <div>
                  <strong>{med.name}</strong>
                  <span style={{ fontSize: "0.85em", color: "#666" }}>{med.dose || ""} at {med.time}</span>
                </div>

                <div className="med-item-actions">
                  {getDisplayStatus(med) === "pending" && (
                    <>
                      <button className="taken-btn" onClick={(e) => { e.stopPropagation(); markAsTaken(med._id); }}>
                        <FaCheck /> {t.markTaken}
                      </button>
                      <button className="skip-btn" onClick={(e) => { e.stopPropagation(); markAsSkipped(med._id); }}>
                        <FaTimes /> {t.skip}
                      </button>
                    </>
                  )}
                  {getDisplayStatus(med) === "taken" && <span className="status-label taken">✅ {t.takenStatus || "Taken"}</span>}
                  {getDisplayStatus(med) === "missed" && <span className="status-label missed">❌ {t.missedStatus || "Skipped"}</span>}
                </div>
              </div>
            ))
          )}
        </div>



        {/* MOOD CHECK-IN */}
        <div className="mood-checkin">
          <h4>How are you feeling today?</h4>
          <div className="mood-options">
            <button className="mood-btn" onClick={() => handleMoodClick("😊")} title="Great">😊</button>
            <button className="mood-btn" onClick={() => handleMoodClick("🙂")} title="Good">🙂</button>
            <button className="mood-btn" onClick={() => handleMoodClick("😐")} title="Okay">😐</button>
            <button className="mood-btn" onClick={() => handleMoodClick("🤒")} title="Not Well">🤒</button>
            <button className="mood-btn" onClick={() => handleMoodClick("😫")} title="Bad">😫</button>
          </div>
          {moodMessage && <div className="mood-toast">{moodMessage}</div>}
        </div>

        {showScanner && <QRScanner onClose={() => setShowScanner(false)} />}
      </div>
    </div>
  );
}

export default Dashboard;