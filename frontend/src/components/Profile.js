import React, { useEffect, useState, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaChartBar, FaBell, FaExclamationCircle, FaCapsules, FaSignOutAlt, FaUser, FaCamera, FaFileMedical, FaQrcode } from "react-icons/fa";
import { QRCodeSVG } from "qrcode.react";
import { SettingsContext } from "./SettingsContext";
import api from "../utils/api";
import "../styles/Profile.css";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [futurePrediction, setFuturePrediction] = useState(0);
  const [showQR, setShowQR] = useState(false);
  const navigate = useNavigate();
  const { t } = useContext(SettingsContext);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user")) || {
      name: "User",
      email: ""
    };
    if (savedUser.fullName) savedUser.name = savedUser.fullName;
    setUser(savedUser);

    api.get("/auth/profile").then(res => {
      const u = res.data;
      if (u.fullName) u.name = u.fullName;
      setUser(u);
      localStorage.setItem("user", JSON.stringify(u));
    }).catch(err => console.error("Error fetching profile", err));

    // Fetch Report Summary
    api.get("/analytics/report").then(res => setReportData(res.data)).catch(err => console.log(err));
    api.get("/analytics").then(res => setFuturePrediction(res.data.futurePrediction || 0)).catch(err => console.log(err));
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("user");
    navigate("/signin");
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      setIsUploading(true);
      try {
        const res = await api.put("/auth/profile", { profileImage: base64String });
        const updatedUser = res.data;
        if (updatedUser.fullName) updatedUser.name = updatedUser.fullName;
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } catch (err) {
        console.error("Error updating profile image", err);
        alert("Failed to update profile image");
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="profile-wrapper">
      <div className="profile-card">
        <h2 className="profile-title">{t("profileHeader")}</h2>

        <div className="user-profile-info">
          <div className="avatar-large" onClick={triggerFileInput} style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
            {user?.profileImage ? (
              <img src={user.profileImage} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              user?.name?.charAt(0).toUpperCase() || <FaUser />
            )}
            <div className="avatar-overlay">
              <FaCamera />
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            style={{ display: 'none' }}
          />
          <div className="user-details">
            <h3>{user?.name}</h3>
            <p>{user?.email}</p>
            <div className="emergency-input-group">
              <input 
                type="text" 
                placeholder="Emergency Contact" 
                value={user?.emergencyContact || ""} 
                onChange={(e) => setUser({...user, emergencyContact: e.target.value})}
              />
              <button onClick={async () => {
                try {
                  await api.put("/auth/profile", { emergencyContact: user.emergencyContact });
                  alert("Emergency contact updated");
                } catch (err) {
                  alert("Failed to update contact");
                }
              }}>Save</button>
            </div>
          </div>
          {isUploading && <p style={{ fontSize: '12px', color: '#2f80ed' }}>Uploading...</p>}
          
          <button className="qr-toggle-btn" onClick={() => setShowQR(!showQR)}>
            <FaQrcode /> {showQR ? "Hide My QR" : "Show My QR"}
          </button>
        </div>

        {showQR && (
          <div className="qr-display-section">
            <p>Scan to view health passport</p>
            <div className="qr-container">
              <QRCodeSVG 
                value={`${window.location.origin}/qr-view/${user?._id}`}
                size={180}
                level={"H"}
                includeMargin={true}
                imageSettings={{
                  src: "/logo192.png",
                  x: undefined,
                  y: undefined,
                  height: 30,
                  width: 30,
                  excavate: true,
                }}
              />
            </div>
            <span className="qr-hint">Useful for emergency responders</span>
          </div>
        )}


        <div className="profile-menu">
          <button className="menu-item" onClick={() => navigate("/analytics")}>
            <FaChartBar className="icon-blue" />
            <span>{t("analyticsBtn")}</span>
          </button>

          <button className="menu-item" onClick={() => navigate("/doctor-report")}>
            <FaFileMedical className="icon-teal" />
            <span>{t("doctorReportTitle") || "Doctor Report"}</span>
          </button>

          <button className="menu-item" onClick={() => navigate("/notifications")}>
            <FaBell className="icon-purple" />
            <span>{t("notificationsBtn")}</span>
          </button>

          <button className="menu-item" onClick={() => navigate("/notify")}>
            <FaBell className="icon-orange" />
            <span>{t("notifyMeBtn")}</span>
          </button>

          <button className="menu-item" onClick={() => navigate("/missed-doses")}>
            <FaExclamationCircle className="icon-red" />
            <span>{t("missedDosesBtn")}</span>
          </button>

          <button className="menu-item" onClick={() => navigate("/refill-reminder")}>
            <FaCapsules className="icon-green" />
            <span>{t("refillReminderBtn")}</span>
          </button>

          <button className="menu-item" onClick={() => navigate("/refill-notifications")}>
            <FaCapsules className="icon-teal" />
            <span>{t("refillNotificationsBtn")}</span>
          </button>

          <button className="menu-item logout-item" onClick={handleSignOut}>
            <FaSignOutAlt className="icon-gray" />
            <span>{t("logoutBtn")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
