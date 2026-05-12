import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/SignIn.css";
import { SettingsContext } from "./SettingsContext";

const BASE_URL = "http://localhost:5000/api";

function SignUp() {
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const { t } = useContext(SettingsContext);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (password !== confirmPassword) {
      setError(t("passMismatchErr"));
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${BASE_URL}/auth/signup`, {
        fullName: name,
        email: identifier,
        password: password,
      });

      console.log("Signup response:", response.data);

      setMessage(response.data.message || t("accountCreatedSuccess"));

      // Redirect after 1.5s
      setTimeout(() => {
        navigate("/signin");
      }, 1500);

    } catch (err) {
      if (err.response) {
        setError(err.response.data.message || t("signUpFailErr"));
      } else if (err.request) {
        setError(t("noServerErr"));
      } else {
        setError(t("signUpFailErr"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      {/* ✅ Floating Success Message */}
      {message && <div className="status-toast success">{message}</div>}

      {/* ❌ Floating Error Message */}
      {error && <div className="status-toast error">{error}</div>}

      <div className="auth-page">
        <h2 className="auth-header">{t("signUpHeader")}</h2>
        <p className="auth-subtitle">{t("Join us today! Create your account below.")}</p>

        <form onSubmit={handleSignUp}>
          <div className="input-group">
            <label htmlFor="name">{t("fullNameLabel")}</label>
            <input
              id="name"
              type="text"
              placeholder={t("fullNamePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">{t("emailLabel")}</label>
            <input
              id="email"
              type="email"
              placeholder={t("emailPlaceholder")}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">{t("passLabel")}</label>
            <input
              id="password"
              type="password"
              placeholder={t("passPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">{t("confirmPassLabel")}</label>
            <input
              id="confirmPassword"
              type="password"
              placeholder={t("confirmPassPlaceholder")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? t("signingUpBtn") : t("signUpBtn")}
          </button>
        </form>

        <p className="switch-text">
          {t("alreadyAccount")}
          <span onClick={() => navigate("/signin")}>{t("signInLink")}</span>
        </p>
      </div>
    </div>
  );
}

export default SignUp;