import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";
import { FaPills, FaUserCircle, FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import "../styles/QRView.css";

const QRView = () => {
  const { userId } = useParams();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        // This would be a public endpoint to see minimal health info in emergency
        const res = await api.get(`/auth/public-profile/${userId}`);
        setUserData(res.data);
      } catch (err) {
        console.error("Error fetching QR data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicData();
  }, [userId]);

  if (loading) return <div className="qr-view-loading">Loading Health Passport...</div>;

  if (!userData) return (
    <div className="qr-view-error">
      <h2>Invalid QR Code</h2>
      <button onClick={() => navigate("/")}>Go Home</button>
    </div>
  );

  return (
    <div className="qr-view-container">
      <div className="qr-view-header">
        <button className="back-btn" onClick={() => navigate(-1)}><FaArrowLeft /></button>
        <h1>Health Passport</h1>
      </div>

      <div className="user-info-card">
        <div className="avatar-section">
          {userData.profileImage ? (
            <img src={userData.profileImage} alt="Profile" className="public-avatar" />
          ) : (
            <FaUserCircle className="public-avatar-placeholder" />
          )}
        </div>
        <h2>{userData.fullName || userData.name}</h2>
        <p className="emergency-label">Emergency Contact: {userData.emergencyContact || "Not Provided"}</p>
      </div>

      <div className="medication-list-section">
        <h3><FaPills /> Active Medications</h3>
        {userData.medications?.length > 0 ? (
          userData.medications.map((med, index) => (
            <div key={index} className="public-med-item">
              <div className="med-main">
                <strong>{med.name}</strong>
                <span>{med.dose} - {med.frequency}</span>
              </div>
              {med.status === "taken" && <FaCheckCircle className="taken-icon" />}
            </div>
          ))
        ) : (
          <p className="no-meds-msg">No active medications found.</p>
        )}
      </div>

      <div className="qr-view-footer">
        <p>Verified by Meditrack AI</p>
      </div>
    </div>
  );
};

export default QRView;
