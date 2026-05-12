import React, { useEffect, useState, useRef, useContext } from "react";
import api from "../utils/api";
import "../styles/DoctorReport.css";
import { SettingsContext } from "./SettingsContext";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { FaUserMd, FaRobot, FaFileMedical, FaChartLine } from "react-icons/fa";

const DoctorReport = () => {
  const { t } = useContext(SettingsContext);
  const [reportData, setReportData] = useState(null);
  const [futurePrediction, setFuturePrediction] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const reportRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportRes, analyticsRes] = await Promise.all([
          api.get("/analytics/report"),
          api.get("/analytics")
        ]);
        setReportData(reportRes.data);
        setFuturePrediction(analyticsRes.data.futurePrediction || 0);
      } catch (err) {
        console.warn("Analytics API failed, falling back to local calculation in DoctorReport", err);
        try {
          const [medRes, remRes] = await Promise.all([
            api.get("/medications"),
            api.get("/reminders")
          ]);
          let fallbackTaken = 0;
          let fallbackMissed = 0;
          let fallbackPending = 0;
          let medMissedCounts = {};
          let maxMissed = 0;
          let mostMissedMed = "";
          let missedDays = {};

          medRes.data.forEach((m) => {
            if (m.status === "taken") fallbackTaken++;
            if (m.status === "missed") {
              fallbackMissed++;
              medMissedCounts[m.name] = (medMissedCounts[m.name] || 0) + 1;
              if (medMissedCounts[m.name] > maxMissed) {
                maxMissed = medMissedCounts[m.name];
                mostMissedMed = m.name;
              }
              const day = new Date().toLocaleDateString("en-US", { weekday: 'long' });
              missedDays[day] = (missedDays[day] || 0) + 1;
            }
            if (m.status === "pending") fallbackPending++;
          });

          remRes.data.forEach((r) => {
            if (r.status === "taken") fallbackTaken++;
            if (r.status === "missed") {
              fallbackMissed++;
              medMissedCounts[r.medication_name] = (medMissedCounts[r.medication_name] || 0) + 1;
              if (medMissedCounts[r.medication_name] > maxMissed) {
                maxMissed = medMissedCounts[r.medication_name];
                mostMissedMed = r.medication_name;
              }
              const day = new Date(r.reminder_date || new Date()).toLocaleDateString("en-US", { weekday: 'long' });
              missedDays[day] = (missedDays[day] || 0) + 1;
            }
            if (r.status === "pending") fallbackPending++;
          });

          const combinedHistory = [
            ...medRes.data.map(m => ({
              medication_name: m.name,
              reminder_date: new Date().toISOString().split("T")[0],
              reminder_time: "Today",
              status: m.status || "pending"
            })),
            ...remRes.data
          ];

          const totalDecided = fallbackTaken + fallbackMissed;
          const currentAdherence = totalDecided > 0 ? (fallbackTaken / totalDecided) * 100 : 100;
          setFuturePrediction(Math.round(currentAdherence));
          setReportData({
            summary: {
              totalDoses: combinedHistory.length,
              taken: fallbackTaken,
              missed: fallbackMissed,
              pending: fallbackPending
            },
            patterns: { mostMissedMed, missedDays },
            history: combinedHistory.slice(0, 20)
          });
        } catch (fallbackErr) {
          console.error("Fallback also failed", fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const downloadPDF = async () => {
    if (!reportRef.current) return;
    setPdfLoading(true);
    try {
      const element = reportRef.current;
      const originalHeight = element.style.height;
      const originalOverflow = element.style.overflow;

      element.style.height = "max-content";
      element.style.overflow = "visible";

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        scrollY: -window.scrollY
      });

      element.style.height = originalHeight;
      element.style.overflow = originalOverflow;

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pdfW) / canvas.width;

      let heightLeft = imgH;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pdfW, imgH);
      heightLeft -= pdfH;

      while (heightLeft > 0) {
        position -= pdfH;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfW, imgH);
        heightLeft -= pdfH;
      }

      pdf.save(`Doctor_Report_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) return <div className="loading-spinner-container"><div className="loading-spinner" /></div>;

  const hasData = reportData?.summary?.totalDoses > 0 || reportData?.history?.length > 0;

  return (
    <div className="dr-report-page">
      <div className="dr-report-header-sticky">
        <button className="back-btn-dr" onClick={() => window.history.back()}>← {t("backBtn")}</button>
        <h2>{t("doctorReportTitle")}</h2>
        <button
          className="download-btn-dr"
          onClick={downloadPDF}
          disabled={pdfLoading}
        >
          {pdfLoading ? t("generatingPdf") : `📥 ${t("downloadReport")}`}
        </button>
      </div>

      <div className="dr-report-container" ref={reportRef}>
        {!hasData ? (
          <p className="no-data" style={{ textAlign: "center", padding: "40px", fontSize: "1.2rem", color: "#666" }}>
            ⚠️ {t("noAnalyticsData") || "No data available to generate report."}
          </p>
        ) : (
          <>
            {/* Prediction Card */}
            <div className="dr-prediction-card">
              <div className="dr-card-icon"><FaRobot /></div>
              <div className="dr-card-content">
                <h3>{t("futureAdherence")}</h3>
                <div className="dr-prediction-value">{futurePrediction}%</div>
                <p className="dr-prediction-text">
                  {futurePrediction > 80
                    ? "Excellent consistency predicted. Maintain current medication routine."
                    : "AI detected potential missed doses next week. Suggest setting stronger alerts."}
                </p>
              </div>
            </div>

            {/* Report Details */}
            <div className="dr-main-report">
              <div className="dr-report-section-header">
                <FaFileMedical /> <span>{t("medDetailsTitle")}</span>
              </div>

              <div className="dr-report-grid">
                <div className="dr-grid-item">
                  <label>{t("patientName")}</label>
                  <span>{JSON.parse(localStorage.getItem("user"))?.fullName || "Patient"}</span>
                </div>
                <div className="dr-grid-item">
                  <label>{t("reportGeneratedOn")}</label>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
                <div className="dr-grid-item">
                  <label>{t("dosesTaken")}</label>
                  <span className="dr-val-success">{reportData?.summary?.taken}</span>
                </div>
                <div className="dr-grid-item">
                  <label>{t("dosesMissed")}</label>
                  <span className="dr-val-error">{reportData?.summary?.missed}</span>
                </div>
              </div>

              <div className="dr-report-patterns">
                <h3>🔍 {t("missedPatterns")}</h3>
                <div className="dr-pattern-box">
                  <div className="dr-pattern-item">
                    <label>{t("mostMissedMed")}</label>
                    <p>{reportData?.patterns?.mostMissedMed || "N/A"}</p>
                  </div>
                  <div className="dr-pattern-item">
                    <label>Temporal Pattern</label>
                    <p>
                      {reportData?.patterns?.missedDays && Object.keys(reportData.patterns.missedDays).length > 0
                        ? `Highest frequency on ${Object.keys(reportData.patterns.missedDays).sort((a, b) => reportData.patterns.missedDays[b] - reportData.patterns.missedDays[a])[0]}s`
                        : "No significant temporal pattern detected."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="dr-history-section">
                <h3>📋 Recent Activity (Last 20)</h3>
                <div className="dr-history-list">
                  {reportData?.history?.length > 0 ? (
                    reportData.history.map((item, idx) => {
                      const displayDate = item.reminder_date || item.dateKey || (item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : "N/A");
                      const displayTime = item.reminder_time || item.scheduleTime || "";
                      return (
                        <div key={idx} className={`dr-history-item ${item.status || "pending"}`}>
                          <span className="dr-hist-name">{item.medication_name || item.name || "Unknown"}</span>
                          <span className="dr-hist-time">{displayDate} {displayTime}</span>
                          <span className="dr-hist-status">{(item.status || "pending").toUpperCase()}</span>
                        </div>
                      );
                    })
                  ) : (
                    <p style={{ textAlign: "center", padding: "20px", color: "#666" }}>No recent activity to display.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DoctorReport;
