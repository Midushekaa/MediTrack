import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "../styles/onboarding.css";

import screen1 from "../assets/onboarding1.png";
import screen2 from "../assets/onboarding2.png";
import screen3 from "../assets/onboarding3.png";

import { SettingsContext } from "./SettingsContext";
import { TEXT } from "../utils/locales";

function Onboarding() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  const { language, setLanguage, theme, setTheme, fontSize, setFontSize } = useContext(SettingsContext);

  const handleComplete = () => {
    navigate("/dashboard");
  };

  const getFontSize = (type) => {
    // These now act as base sizes, but CSS media queries will adjust them for mobile
    const sizes = {
      small: { h: "1.4rem", p: "0.95rem", label: "0.9rem" },
      medium: { h: "1.8rem", p: "1.05rem", label: "1rem" },
      large: { h: "2.2rem", p: "1.2rem", label: "1.1rem" },
    };
    return sizes[type] || sizes.medium;
  };

  const font = getFontSize(fontSize);

  return (
    <div className="onboarding-wrapper">
      <div
        className="onboarding-mobile-container"
        style={{ backgroundColor: "var(--bg-color)", color: "var(--text-color)" }}
      >
        <div className="onboarding-page">
          <div className="skip-container">
            <button 
              className="skip-btn" 
              onClick={() => navigate("/dashboard")}
              aria-label={TEXT[language].skip}
            >
              {TEXT[language].skip}
            </button>
          </div>

          <Swiper
            modules={[Pagination]}
            pagination={{ clickable: true }}
            slidesPerView={1}
            onSlideChange={(swiper) => setCurrentSlide(swiper.activeIndex)}
            className="mySwiper"
          >
            <SwiperSlide>
              <div className="img-wrapper">
                <img src={screen1} className="onboarding-img" alt={TEXT[language].slide1_title} />
              </div>
              <h2 style={{ fontSize: font.h }}>{TEXT[language].slide1_title}</h2>
              <p style={{ fontSize: font.p }}>{TEXT[language].slide1_desc}</p>
            </SwiperSlide>

            <SwiperSlide>
              <div className="img-wrapper">
                <img src={screen2} className="onboarding-img" alt={TEXT[language].slide2_title} />
              </div>
              <h2 style={{ fontSize: font.h }}>{TEXT[language].slide2_title}</h2>
              <p style={{ fontSize: font.p }}>{TEXT[language].slide2_desc}</p>
            </SwiperSlide>

            <SwiperSlide>
              <div className="img-wrapper">
                <img src={screen3} className="onboarding-img" alt={TEXT[language].slide3_title} />
              </div>
              <h2 style={{ fontSize: font.h }}>{TEXT[language].slide3_title}</h2>
              <p style={{ fontSize: font.p }}>{TEXT[language].slide3_desc}</p>
            </SwiperSlide>

            <SwiperSlide>
              <div className="settings-slide-content">
                <h2 style={{ fontSize: font.h }}>{TEXT[language].slide4_title}</h2>
                <p style={{ fontSize: font.p, marginBottom: "20px" }}>{TEXT[language].slide4_desc}</p>

                <div className="setting-block">
                  <label htmlFor="language-select">{TEXT[language].language_label}</label>
                  <select 
                    id="language-select"
                    value={language} 
                    onChange={(e) => setLanguage(e.target.value)}
                    style={{ fontSize: font.label }}
                  >
                    <option value="en">English</option>
                    <option value="ta">தமிழ்</option>
                  </select>
                </div>

                <div className="setting-block">
                  <label htmlFor="theme-select">{TEXT[language].theme_label}</label>
                  <select 
                    id="theme-select"
                    value={theme} 
                    onChange={(e) => setTheme(e.target.value)}
                    style={{ fontSize: font.label }}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>

                <div className="setting-block">
                  <label htmlFor="font-select">{TEXT[language].font_label}</label>
                  <select 
                    id="font-select"
                    value={fontSize} 
                    onChange={(e) => setFontSize(e.target.value)}
                    style={{ fontSize: font.label }}
                  >
                    <option value="small">{language === "en" ? "Small" : "சிறியது"}</option>
                    <option value="medium">{language === "en" ? "Normal" : "சாதாரண"}</option>
                    <option value="large">{language === "en" ? "Large" : "பெரியது"}</option>
                  </select>
                </div>

                <button 
                  className="get-started-btn" 
                  onClick={handleComplete}
                  aria-label={TEXT[language].continue}
                >
                  {TEXT[language].continue}
                </button>
              </div>
            </SwiperSlide>
          </Swiper>
          <div className="onboarding-footer-decoration">
            <div className="doud doud-1"></div>
            <div className="doud doud-2"></div>
            <div className="doud doud-3"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Onboarding;
