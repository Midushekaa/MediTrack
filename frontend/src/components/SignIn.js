import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/SignIn.css";
import { SettingsContext } from "./SettingsContext";

const BASE_URL = "http://localhost:5000/api";

function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const { t } = useContext(SettingsContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    // ✅ Simple frontend validation
    if (!email.includes("@")) {
      setError(t("invalidEmailErr"));
      return;
    }

    if (password.length < 4) {
      setError(t("shortPassErr"));
      return;
    }

    try {
      const res = await axios.post(`${BASE_URL}/auth/signin`, {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setMessage(t("loginSuccess"));

      setTimeout(() => {
        navigate("/onboarding");
      }, 1500);

    } catch (err) {
      console.log(err);

      const backendMsg = err.response?.data?.message?.toLowerCase();

      if (backendMsg?.includes("not found")) {
        setError(t("noAccountErr"));
      } else if (backendMsg?.includes("invalid email")) {
        setError(t("invalidEmailErr"));
      } else if (backendMsg?.includes("password")) {
        setError(t("wrongPassErr"));
      } else if (backendMsg?.includes("credential")) {
        setError(t("wrongCredsErr"));
      } else {
        setError(t("loginFailErr"));
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
        <h2 className="auth-header">{t("signInHeader")}</h2>
        <p className="auth-subtitle">{t("Welcome back! Please enter your details.")}</p>

        <form onSubmit={handleLogin}>
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
            <label>{t("passLabel")}</label>
            <input
              type="password"
              placeholder={t("passPlaceholder")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={error ? "input-error" : ""}
              required
            />
          </div>

          <div className="forgot-password">
            <span onClick={() => navigate("/reset-password")}>
              {t("forgotPass")}
            </span>
          </div>

          <button type="submit" className="submit-btn">
            {t("signInBtn")}
          </button>
        </form>

        <p className="switch-text">
          {t("noAccount")}
          <span onClick={() => navigate("/signup")}>{t("signUpLink")}</span>
        </p>
      </div>
    </div>
  );
}

export default SignIn;