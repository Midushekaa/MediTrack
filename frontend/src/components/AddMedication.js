import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../utils/api";
import "../styles/AddMedication.css";
import { FaSave, FaTimes } from "react-icons/fa";
import { SettingsContext } from "./SettingsContext";

function AddMedication() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useContext(SettingsContext);

  const [newMed, setNewMed] = useState({
    name: "",
    dose: "",
    time: "",
    category: "",
    frequency: "",
    notes: "",
    startDate: "",
    endDate: "",
    totalQuantity: "",
    dosagePerDay: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Load med data if in edit mode
  useEffect(() => {
    if (id) {
      const fetchMed = async () => {
        try {
          const cleanId = id.trim().replace(/^\//, "");
          const res = await api.get(`/medications/${cleanId}`);
          const data = res.data;
          
          if (data) {
            setNewMed({
              name: data.name || "",
              dose: data.dose || "",
              time: data.scheduleTime || data.time || "",
              category: data.category || "",
              frequency: data.frequency || "",
              notes: data.notes || "",
              startDate: data.startDate ? data.startDate.split("T")[0] : "",
              endDate: data.endDate ? data.endDate.split("T")[0] : "",
              totalQuantity: data.totalQuantity || "",
              dosagePerDay: data.dosagePerDay || "",
              _id: data._id
            });
          }
        } catch (err) {
          console.error("Fetch failed", err);
          if (err.response?.status === 401) {
            setError("❌ Session expired. Please sign in again.");
          } else if (err.response?.status === 404) {
            setError("❌ Medication not found.");
          } else {
            setError("❌ Could not load medication data. Check your connection.");
          }
        }
      };
      fetchMed();
    }
  }, [id]);

  const handleSaveMedication = async () => {
    const { name, dose, time, category, frequency, startDate } = newMed;

    setMessage("");
    setError("");

    if (!name || !dose || !time || !category || !frequency || !startDate) {
      setError(t("fillAllFieldsError"));
      return;
    }

    // Map time to scheduleTime for backend and strip metadata
    const { _id, user, createdAt, updatedAt, __v, ...cleanMed } = newMed;
    const payload = { ...cleanMed, scheduleTime: time };

    try {
      if (id) {
        await api.put(`/medications/${id}`, payload);
        setMessage(t("updated") || "Medication updated successfully ✏️");
      } else {
        await api.post("/medications", payload);
        setMessage(t("medAddedSuccess"));
      }

      setTimeout(() => navigate("/medication"), 1900);
    } catch (err) {
      console.error("Save failed", err);
      setError("❌ Failed to save medication");
    }
  };

  return (
    <div className="add-med-wrapper">
      <div className="add-form-page">
        <h2>{id ? t("editMedHeader") : t("addNewMed")}</h2>

      <div className="input-group">
        <label>{t("medNameLabel")}</label>
        <input
          type="text"
          placeholder={t("medNamePlaceholder")}
          value={newMed.name}
          onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
        />
      </div>

      <div className="input-group">
        <label>{t("doseLabel")}</label>
        <input
          type="text"
          placeholder={t("dosePlaceholder")}
          value={newMed.dose}
          onChange={(e) => setNewMed({ ...newMed, dose: e.target.value })}
        />
      </div>

      <div className="input-group">
        <label>{t("timeLabel")}</label>
        <input
          type="time"
          value={newMed.time}
          onChange={(e) => setNewMed({ ...newMed, time: e.target.value })}
        />
      </div>

      <div className="input-group">
        <label>{t("startDateLabel")}</label>
        <input
          type="date"
          value={newMed.startDate}
          onChange={(e) =>
            setNewMed({ ...newMed, startDate: e.target.value })
          }
        />
      </div>

      <div className="input-group">
        <label>{t("endDateLabel")}</label>
        <input
          type="date"
          value={newMed.endDate}
          onChange={(e) =>
            setNewMed({ ...newMed, endDate: e.target.value })
          }
        />
      </div>

      <div className="input-group">
        <label>{t("frequencyLabel")}</label>
        <select
          value={newMed.frequency}
          onChange={(e) =>
            setNewMed({ ...newMed, frequency: e.target.value })
          }
        >
          <option value="">{t("freqPlaceholder")}</option>
          <option value="Daily">{t("freqDaily")}</option>
          <option value="Weekly">{t("freqWeekly")}</option>
          <option value="As-needed">{t("freqAsNeeded")}</option>
        </select>
      </div>

      <div className="input-group">
        <label>{t("categoryLabel")}</label>
        <select
          value={newMed.category}
          onChange={(e) =>
            setNewMed({ ...newMed, category: e.target.value })
          }
        >
          <option value="">{t("catPlaceholder")}</option>
          <option value="Breakfast">{t("catBreakfast")}</option>
          <option value="Lunch">{t("catLunch")}</option>
          <option value="Dinner">{t("catDinner")}</option>
        </select>
      </div>

         <div className="input-row-modern">
        <div className="input-group">
          <label>{t("total Quantity Tablets") || "Total Quantity (e.g. 30)"}</label>
          <input
            type="number"
            placeholder="30"
            value={newMed.totalQuantity || ""}
            onChange={(e) => setNewMed({ ...newMed, totalQuantity: e.target.value })}
          />
        </div>
        <div className="input-group">
          <label>{t("dosage PerDay Tablets") || "Dosage Per Day (e.g. 2)"}</label>
          <input
            type="number"
            placeholder="2"
            value={newMed.dosagePerDay || ""}
            onChange={(e) => setNewMed({ ...newMed, dosagePerDay: e.target.value })}
          />
        </div>
      </div>

      <div className="input-group">
        <label>{t("notesLabel")}</label>
        <textarea
          placeholder={t("notesPlaceholder")}
          value={newMed.notes}
          onChange={(e) =>
            setNewMed({ ...newMed, notes: e.target.value })
          }
        />
      </div>

   

      {/* ✅ SUCCESS/ERROR TOAST */}
      {message && <div className="status-toast success">{message}</div>}
      {error && <div className="status-toast error">{error}</div>}

      <div className="form-buttons">
        <button onClick={handleSaveMedication}><FaSave /> {t("saveBtn")}</button>
        <button onClick={() => navigate("/medication")}><FaTimes /> {t("cancelBtn")}</button>
      </div>
      </div>
    </div>
  );
}

export default AddMedication;