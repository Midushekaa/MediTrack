import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { FaCapsules, FaClock, FaCalendarAlt, FaHistory, FaTag, FaNotesMedical, FaArrowLeft, FaHashtag, FaPrescription } from "react-icons/fa";
import { SettingsContext } from "./SettingsContext";
import "../styles/medicationDetails.css";

function MedicationDetails() {
  const navigate = useNavigate();
  const { t } = useContext(SettingsContext);
  const [med, setMed] = useState(null);

  useEffect(() => {
    const selectedMed = sessionStorage.getItem("selectedMed");
    if (selectedMed) {
      setMed(JSON.parse(selectedMed));
    } else {
      navigate("/medication");
    }
  }, [navigate]);

  if (!med) return null;

  return (
    <div className="details-background">
      <div className="details-container">
        <div className="details-header">
           <h2>{t("medDetailsTitle") || "Medication Details"}</h2>
        </div>

        <div className="med-info">
          <div className="info-item">
            <div className="info-text">
               <strong>💊 {t("medNameLabel") || "Medication Name"} - </strong>
               <span>{med.name}</span>
            </div>
          </div>

          <div className="info-item">
            <div className="info-text">
               <strong>💧 {t("doseLabel") || "Dose"} - </strong>
               <span>{med.dose}</span>
            </div>
          </div>

          <div className="info-item">
            <div className="info-text">
               <strong>⏰ {t("timeLabel") || "Scheduled Time"} - </strong>
               <span>{med.time || med.scheduleTime}</span>
            </div>
          </div>

          <div className="info-item">
            <div className="info-text">
               <strong>🔁 {t("frequencyLabel") || "Frequency"} - </strong>
               <span>{med.frequency}</span>
            </div>
          </div>

          <div className="info-item">
            <div className="info-text">
               <strong>📦 {t("totalQuantityLabel") || "Total Quantity"} - </strong>
               <span>{med.totalQuantity || "-"}</span>
            </div>
          </div>

          <div className="info-item">
            <div className="info-text">
               <strong>📉 {t("dosagePerDayLabel") || "Dosage Per Day"} - </strong>
               <span>{med.dosagePerDay || "-"}</span>
            </div>
          </div>

          <div className="info-item">
            <div className="info-text">
               <strong>📅 {t("startDateLabel") || "Start Date"} - </strong>
               <span>{med.startDate ? new Date(med.startDate).toLocaleDateString() : "-"}</span>
            </div>
          </div>

          <div className="info-item">
            <div className="info-text">
               <strong>🏁 {t("endDateLabel") || "End Date"} - </strong>
               <span>{med.endDate ? new Date(med.endDate).toLocaleDateString() : "-"}</span>
            </div>
          </div>

          <div className="info-item">
            <div className="info-text">
               <strong>📂 {t("categoryLabel") || "Category"} - </strong>
               <span>{med.category || "-"}</span>
            </div>
          </div>

          {med.notes && (
            <div className="info-item">
              <div className="info-text">
                 <strong>📝 {t("notesLabel") || "Notes"} - </strong>
                 <span>{med.notes}</span>
              </div>
            </div>
          )}
        </div>

        <div className="details-actions">
          <button className="back-btn" onClick={() => navigate("/medication")}>
            {t("backBtn") || "Back"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MedicationDetails;
