import React from "react";
import { NavLink } from "react-router-dom";
import { FaHome, FaMedkit, FaUser } from "react-icons/fa";
import "../styles/Footer.css"; // optional CSS file

export default function Footer() {
  return (
    <div className="footer-container">
      <NavLink to="/dashboard" className="footer-tab">
        <FaHome size={24} />
        <span>Home</span>
      </NavLink>

      <NavLink to="/medication" className="footer-tab">
        <FaMedkit size={24} />
        <span>Meds</span>
      </NavLink>

      <NavLink to="/profile" className="footer-tab">
        <FaUser size={24} />
        <span>Profile</span>
      </NavLink>
    </div>
  );
}
