import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/AdminSignIn.css";

const BASE_URL = "http://localhost:5000/api";

function AdminSignIn() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const res = await axios.post(`${BASE_URL}/admin/auth/login`, { email: identifier, password });
      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem("adminUser", JSON.stringify(res.data.admin));
      
      setSuccess("Sign in successful! Redirecting to dashboard...");
      
      // Delay navigation to show the success message
      setTimeout(() => {
        navigate("/admin-dashboard");
      }, 1500);
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Invalid email or password. Please try again.");
      } else {
        setError(err.response?.data?.message || "Invalid email or password. Please try again.");
      }
    }
  };

  return (
    <div className="admin-page-container">
      {/* ✅ Floating Success Message */}
      {success && <div className="admin-login-success">{success}</div>}

      {/* ❌ Floating Error Message */}
      {error && <div className="admin-login-error">{error}</div>}

      <div className="admin-login-card">
        <h2 className="admin-login-title">Admin Portal</h2>
        <p className="admin-login-subtitle">Secure access to MediTrack dashboard</p>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="text"
              placeholder="Enter your email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="admin-login-btn">
            SIGN IN
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminSignIn;
