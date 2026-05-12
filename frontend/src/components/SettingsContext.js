import React, { createContext, useState, useEffect } from "react";
import { TEXT } from "../utils/locales";

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  // Initialize from localStorage directly to prevent flicker/overwrite
  const [language, setLanguage] = useState(() => {
    const saved = JSON.parse(localStorage.getItem("user_settings"));
    return saved?.language || "en";
  });
  const [theme, setTheme] = useState(() => {
    const saved = JSON.parse(localStorage.getItem("user_settings"));
    return saved?.accessibility?.theme || "light";
  });
  const [fontSize, setFontSize] = useState(() => {
    const saved = JSON.parse(localStorage.getItem("user_settings"));
    return saved?.accessibility?.fontSize || "medium";
  });

  // Apply theme/fontSize and save to localStorage
  useEffect(() => {
    const root = document.documentElement;

    // Theme
    if (theme === "light") {
      root.style.setProperty("--bg-color", "#ffffff");
      root.style.setProperty("--text-color", "#555555");
      root.style.setProperty("--heading-color", "#333333");
      root.style.setProperty("--primary-color", "#2f80ed");
      root.style.setProperty("--card-bg", "rgba(255, 255, 255, 0.95)");
      root.style.setProperty("--input-bg", "#fcfcfc");
      root.style.setProperty("--border-color", "#e0e0e0");
      root.style.setProperty("--shadow-color", "rgba(0, 0, 0, 0.05)");
      root.style.setProperty("--body-bg", "linear-gradient(135deg, #2f80ed, #56ccf2)");
    } else if (theme === "dark") {
      root.style.setProperty("--bg-color", "#121212");
      root.style.setProperty("--text-color", "#f1f5f9");
      root.style.setProperty("--heading-color", "#ffffff");
      root.style.setProperty("--primary-color", "#56ccf2");
      root.style.setProperty("--card-bg", "rgba(30, 41, 59, 0.95)");
      root.style.setProperty("--input-bg", "#1e293b");
      root.style.setProperty("--border-color", "#334155");
      root.style.setProperty("--shadow-color", "rgba(0, 0, 0, 0.4)");
      root.style.setProperty("--body-bg", "linear-gradient(135deg, #0f172a, #1e293b)");
    } else if (theme === "high-contrast") {
      root.style.setProperty("--bg-color", "#000000");
      root.style.setProperty("--text-color", "#ffff00");
      root.style.setProperty("--heading-color", "#ffff00");
      root.style.setProperty("--primary-color", "#ffffff");
      root.style.setProperty("--card-bg", "#000000");
      root.style.setProperty("--input-bg", "#000000");
      root.style.setProperty("--border-color", "#ffffff");
      root.style.setProperty("--shadow-color", "transparent");
      root.style.setProperty("--body-bg", "#000000");
    }

    // Font Size
    if (fontSize === "small") {
      root.style.setProperty("--font-h", "1.2rem");
      root.style.setProperty("--font-p", "0.85rem");
      root.style.setProperty("--font-label", "0.9rem");
    } else if (fontSize === "medium") {
      root.style.setProperty("--font-h", "1.6rem");
      root.style.setProperty("--font-p", "1rem");
      root.style.setProperty("--font-label", "1rem");
    } else if (fontSize === "large") {
      root.style.setProperty("--font-h", "2rem");
      root.style.setProperty("--font-p", "1.2rem");
      root.style.setProperty("--font-label", "1.1rem");
    }

    // Save settings
    localStorage.setItem(
      "user_settings",
      JSON.stringify({
        language,
        accessibility: { theme, fontSize },
      })
    );
  }, [language, theme, fontSize]);

  const t = (key) => {
    return TEXT[language]?.[key] || TEXT.en[key] || key;
  };

  return (
    <SettingsContext.Provider
      value={{ language, setLanguage, theme, setTheme, fontSize, setFontSize, t }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
