import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/medicin.png";
import "../styles/Splash.css";

function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/signin");
    }, 5000); // 5 seconds

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="splash-wrapper">
      <div className="splash-card">
        <img src={logo} alt="MediTrack Logo" className="splash-logo" />
        <h1 className="splash-title">
          Welcome to MediTrack
        </h1>

        <p className="splash-sub">
          Your trusted companion for staying on track with your medications through smart reminders and personalized insights.
        </p>
      </div>
    </div>
  );
}

export default Splash;
