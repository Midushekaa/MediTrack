import React, { useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/SignIn.css";
import { SettingsContext } from "./SettingsContext";

const BASE_URL = "http://localhost:5000/api";

function ResetPassword() {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const { t } = useContext(SettingsContext);
  const navigate = useNavigate();

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    // ✅ Validation
    if (!email || !newPassword || !confirmPassword) {
      setError(t("fillAllFieldsErr"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("passMismatchErr"));
      return;
    }

    try {
      await axios.post(`${BASE_URL}/auth/reset-password`, {
        email,
        password: newPassword,
      });

      setMessage(t("Reset Password Successfull"));

      // redirect after 1.5 sec
      setTimeout(() => {
        navigate("/signin");
      }, 1500);

    } catch (err) {
      console.error(err);

      const backendMsg = err.response?.data?.message?.toLowerCase();

      if (backendMsg?.includes("not found")) {
        setError(t("noAccountErr"));
      } else {
        setError(t("resetPassFailErr"));
      }
    }
  };

  return (
    <div className="auth-wrapper">
      {/* ✅ Floating Success Message */}
      {message && <div className="status-toast success">{message}</div>}

      {/* ❌ Floating Error Message */}
      {error && <div className="status-toast error">{error}</div>}

      <div className="auth-page">
        <h2 className="auth-header">{t("Reset Password")}</h2>
        <p className="auth-subtitle">{t("Set a new password for your account.")}</p>

        <form onSubmit={handleResetPassword}>
          <div className="input-group">
            <label>{t("emailLabel")}</label>
            <input
              type="email"
              placeholder={t("emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={error ? "input-error" : ""}
              required
            />
          </div>

          <div className="input-group">
            <label>{t("New Password")}</label>
            <input
              type="password"
              placeholder={t(" New Password")}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={error ? "input-error" : ""}
              required
            />
          </div>

          <div className="input-group">
            <label>{t("confirmPassLabel")}</label>
            <input
              type="password"
              placeholder={t("confirm Password")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={error ? "input-error" : ""}
              required
            />
          </div>

          <button type="submit" className="submit-btn">
            {t("Reset Password")}
          </button>
        </form>

        <p className="switch-text">
          {t("Back To ")}
          <span onClick={() => navigate("/signin")}>{t("signInLink")}</span>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;