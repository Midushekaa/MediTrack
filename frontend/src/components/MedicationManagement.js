import React, { useState, useEffect, useContext } from "react";
import api from "../utils/api";
import "../styles/medication.css";
import { FaPlus, FaEdit, FaTrash, FaCheck } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { SettingsContext } from "./SettingsContext";
import { TEXT } from "../utils/locales";

function MedicationManagement() {
  const { language, t } = useContext(SettingsContext);

  const [userName, setUserName] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [medications, setMedications] = useState([]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const isSameDate = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  // LOAD DATA
  useEffect(() => {
    // ── Resolve user name from localStorage (try several field names) ──
    const resolveUserName = async () => {
      try {
        const stored = JSON.parse(localStorage.getItem("user"));
        const localName =
          stored?.fullName ||   // ← User model field
          stored?.name ||
          stored?.firstName ||
          stored?.username ||
          stored?.email?.split("@")[0];

        if (localName) {
          setUserName(localName);
        } else {
          // Fallback: fetch from profile API
          const res = await api.get("/auth/profile");
          const apiName =
            res.data?.name ||
            res.data?.firstName ||
            res.data?.username ||
            res.data?.email?.split("@")[0] ||
            "User";
          setUserName(apiName);
          // Cache it so future loads are instant
          if (stored) {
            localStorage.setItem("user", JSON.stringify({ ...stored, name: apiName }));
          }
        }
      } catch {
        setUserName("User");
      }
    };

    resolveUserName();

    const fetchMeds = async () => {
      try {
        const res = await api.get("/medications");
        const parsed = res.data.map((m) => ({
          ...m,
          startDate: new Date(m.startDate || m.date),
          endDate: m.endDate ? new Date(m.endDate) : null,
          time: m.scheduleTime || m.time,
        }));
        setMedications(parsed);
      } catch (err) {
        console.error("Fetch failed", err);
        setError("❌ Failed to load medications");
      }
    };

    fetchMeds();
  }, []);

  // DELETE MEDICATION
  const handleDeleteMedication = async (id) => {
    if (!id) {
      console.error("No ID provided for deletion");
      return;
    }

    try {
      await api.delete(`/medications/${id}`);
      setMedications((prev) => prev.filter((m) => (m._id || m.id) !== id));
      
      const successMsg = t("deleted") || "Medication deleted successfully 🗑️";
      setMessage(successMsg);
      setTimeout(() => setMessage(""), 2000);
    } catch (err) {
      console.error("Delete failed", err);
      const errMsg = t("deleteFailErr") || "❌ Failed to delete medication";
      setError(errMsg);
      setTimeout(() => setError(""), 2000);
    }
  };

  // UPDATE NAVIGATION
  const handleEditMedication = (id) => {
    navigate(`/edit-medication/${id}`);
  };

  // ADD MEDICATION
  const handleAddMedication = () => {
    navigate("/add-medication");
  };

  // VIEW DETAILS
  const handleMedClick = (med) => {
    sessionStorage.setItem("selectedMed", JSON.stringify(med));
    navigate("/details");
  };

  // CALENDAR
  const getNext7Days = () => {
    const days = [];
    for (let i = -1; i <= 5; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date);
    }
    return days;
  };

  // FILTER MEDICATIONS
  const medsForSelectedDate = medications.filter((med) => {
    const start = med.startDate;
    const end = med.endDate || med.startDate;

    return (
      isSameDate(selectedDate, start) ||
      (end && selectedDate >= start && selectedDate <= end)
    );
  });

  // GROUP
  const groupedMeds = {
    Breakfast: medsForSelectedDate.filter((m) => m.category === "Breakfast"),
    Lunch: medsForSelectedDate.filter((m) => m.category === "Lunch"),
    Dinner: medsForSelectedDate.filter((m) => m.category === "Dinner"),
  };

  // DYNAMIC GREETING
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return TEXT[language].greetingMorning;
    if (hour < 18) return TEXT[language].greetingAfternoon;
    return TEXT[language].greetingEvening;
  };

  return (
    <div className="medication-wrapper">

      {/* ✅ SUCCESS/ERROR TOAST */}
      {message && (
        <div className="status-toast success">
          <FaCheck className="toast-icon" /> {message}
        </div>
      )}
      {error && (
        <div className="status-toast error">
          <FaTrash className="toast-icon" /> {error}
        </div>
      )}

      {/* HEADER */}
      <div className="dashboard-header">
        <h2>
          {getGreeting()}, <b>{userName}</b> 👋
        </h2>
        <p>
          {TEXT[language].today},{" "}
          {selectedDate.toLocaleDateString(undefined, {
            day: "numeric",
            month: "long",
          })}
        </p>
      </div>

      {/* CALENDAR */}
      <div className="calendar-container">
        {getNext7Days().map((date, idx) => (
          <div
            key={idx}
            className={`calendar-day ${
              isSameDate(date, selectedDate) ? "selected" : ""
            }`}
            onClick={() => setSelectedDate(date)}
          >
            <div>{date.getDate()}</div>
            <div>
              {date.toLocaleDateString(undefined, {
                weekday: "short",
              })}
            </div>
          </div>
        ))}
      </div>

      {/* MEDICATION LIST */}
      <div className="medication-list">
        {["Breakfast", "Lunch", "Dinner"].map((category) => (
          <div className="category-container" key={category}>
            <h4 className="category-title">
              {TEXT[language][category.toLowerCase()]}
            </h4>

            {groupedMeds[category].length > 0 ? (
              groupedMeds[category].map((med) => (
                <div
                  className="med-card"
                  key={med._id}
                  onClick={() => handleMedClick(med)}
                >
                  {/* DETAILS */}
                  <div className="med-details">
                    <h5>{med.name}</h5>
                    <p>{med.dose}</p>
                    <div className="med-inventory-summary">
                       <span>📦 {med.totalQuantity || "-"} {t("totalQuantityLabel") || "Total"}</span>
                       <span>📉 {med.dosagePerDay || "-"} {t("dosagePerDayLabel") || "Dosage"}</span>
                    </div>
                    <p>
                      {med.time} ({med.frequency})
                    </p>
                    {med.notes && <p>📝 {med.notes}</p>}
                  </div>

                  {/* ACTIONS */}
                  <div className="med-actions">

                    <button
                      className="edit-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditMedication(med._id);
                      }}
                    >
                      <FaEdit />
                    </button>

                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMedication(med._id);
                      }}
                    >
                      <FaTrash />
                    </button>

                  </div>
                </div>
              ))
            ) : (
              <p className="no-med-text">
                {TEXT[language].noMed}{" "}
                {TEXT[language][category.toLowerCase()]}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ADD BUTTON */}
      <button className="add-med-btn" onClick={handleAddMedication}>
        <FaPlus />
      </button>
    </div>
  );
}

export default MedicationManagement; 