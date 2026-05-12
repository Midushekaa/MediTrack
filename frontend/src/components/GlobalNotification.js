import React, { useState, useEffect, useRef, useContext } from "react";
import api from "../utils/api";
import { SettingsContext } from "./SettingsContext";

const GlobalNotification = () => {
  const { language, t } = useContext(SettingsContext);
  const [voiceUnlocked, setVoiceUnlocked] = useState(
    () => localStorage.getItem("meditrack_voice_unlocked") === "true"
  );

  const remindersRef = useRef([]);
  const medicationsRef = useRef([]);
  const rawRefillsRef = useRef([]);
  const alertedIdsRef = useRef(new Set());
  const lowStockAlertedIdsRef = useRef(new Set(
    JSON.parse(localStorage.getItem("meditrack_low_notified") || "[]")
  ));
  const voiceRef = useRef(voiceUnlocked);

  const unlockVoice = () => {
    if (voiceRef.current) return;
    const silent = new SpeechSynthesisUtterance(" ");
    silent.volume = 0;
    window.speechSynthesis.speak(silent);
    voiceRef.current = true;
    setVoiceUnlocked(true);
    localStorage.setItem("meditrack_voice_unlocked", "true");
  };

  useEffect(() => {
    const handleInteraction = () => unlockVoice();
    document.addEventListener("click", handleInteraction);
    return () => document.removeEventListener("click", handleInteraction);
  }, []);

  const speakVoice = (text) => {
    if (!window.speechSynthesis || !voiceRef.current) return;
    
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      // If voices aren't loaded yet, wait and retry once
      setTimeout(() => speakVoice(text), 200);
      return;
    }

    window.speechSynthesis.cancel();
    const segments = text.split(/[,:]/);
    const queue = [];

    segments.forEach((segment) => {
      const cleanSegment = segment.trim();
      if (!cleanSegment) return;

      const u = new SpeechSynthesisUtterance(cleanSegment);
      const isTamil = /[\u0B80-\u0BFF]/.test(cleanSegment);

      if (isTamil) {
        // Priority: Google Tamil -> Microsoft Valluvar -> Any Tamil -> Default ta-IN
        const taVoice = 
          voices.find(v => v.name.includes("Google") && v.lang.startsWith("ta")) ||
          voices.find(v => v.name.includes("Valluvar")) ||
          voices.find(v => v.lang.toLowerCase().includes("ta"));
          
        if (taVoice) {
          u.voice = taVoice;
          u.lang = taVoice.lang;
        } else {
          u.lang = "ta-IN";
        }
      } else {
        const enVoice = voices.find(v => v.lang.toLowerCase().includes("en"));
        if (enVoice) {
          u.voice = enVoice;
          u.lang = enVoice.lang;
        } else {
          u.lang = "en-US";
        }
      }

      u.rate = isTamil ? 0.8 : 0.9;
      u.pitch = 1.0;
      u.volume = 1.0;
      queue.push(u);
    });

    const playNext = (index) => {
      if (index >= queue.length) return;
      const currentU = queue[index];

      // Safety: Some browsers fail to fire onend if voice is missing
      let hasEnded = false;
      const onEndAction = () => {
        if (hasEnded) return;
        hasEnded = true;
        setTimeout(() => playNext(index + 1), 200);
      };

      currentU.onend = onEndAction;
      currentU.onerror = onEndAction;
      
      // Forced timeout fallback (3 seconds per segment)
      setTimeout(onEndAction, 4000);

      window.speechSynthesis.speak(currentU);
    };

    if (queue.length > 0) playNext(0);
  };

  const sendPushNotification = (title, body) => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "https://cdn-icons-png.flaticon.com/512/4144/4144781.png",
      });
    } else {
      Notification.requestPermission().then((p) => {
        if (p === "granted") new Notification(title, { body });
      });
    }
  };

  const fetchAll = async () => {
    try {
      const [remRes, medRes, refRes] = await Promise.all([
        api.get("/reminders"),
        api.get("/medications"),
        api.get("/refills"),
      ]);
  
      const fmtReminders = remRes.data.map((r) => ({ id: r._id, ...r }));
      
      const fmtMeds = medRes.data.map((m) => ({
        id: m._id,
        medication_name: m.name,
        reminder_time: (m.scheduleTime || m.time || "").trim(),
        reminder_type: "voice",
        voice_prompt: `${t("takeTime")}: ${m.name}, ${m.dose}`,
        status: m.status || "pending",
        source: "medication",
      }));

      // Flatten Refills into 3 specific time slots if they match today or future date logic
      const fmtRefills = [];
      refRes.data.forEach((r) => {
        const slots = [
          { time: r.morning_time, label: t("morning") || "Morning" },
          { time: r.afternoon_time, label: t("afternoon") || "Afternoon" },
          { time: r.evening_time, label: t("evening") || "Evening" },
        ];

        slots.forEach((slot, idx) => {
          if (slot.time) {
            fmtRefills.push({
              id: `${r._id}-${idx}`,
              medication_name: `${t("refillAlert") || "Refill"}: ${r.medication_name}`,
              reminder_time: slot.time.trim(),
              reminder_date: r.reminder_date,
              reminder_type: "voice",
              voice_prompt: `${t("refillRemindPrompt") || "It is time for your refill"}: ${r.medication_name}. ${t("remainingPillsLabel") || "Pills left"}: ${r.remaining_pills}`,
              status: "pending",
              source: "refill",
            });
          }
        });
      });
  
      remindersRef.current = fmtReminders;
      medicationsRef.current = [...fmtMeds, ...fmtRefills];
      rawRefillsRef.current = refRes.data;
    } catch (err) {
      console.error("GlobalNotification Fetch Error:", err);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const ticker = setInterval(() => {
      const now = new Date();
      const curr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const currDate = now.toISOString().split("T")[0];
      let messagesToSpeak = [];

      // 1. Check Reminders & Medications
      [...remindersRef.current, ...medicationsRef.current].forEach((r) => {
        const rTime = (r.reminder_time || "").trim();
        const rDate = r.reminder_date;
        const key = `${r.id}-${curr}`;

        const dateMatches = !rDate || rDate === currDate;

        if (
          r.status === "pending" &&
          rTime === curr &&
          dateMatches &&
          !alertedIdsRef.current.has(key)
        ) {
          alertedIdsRef.current.add(key);

          // Prepare Message
          let msg = r.voice_prompt || "";
          const lowerMsg = msg.toLowerCase();
          const isDefaultEnglish = 
            lowerMsg.includes("time to take") || 
            lowerMsg.includes("medication reminder") || 
            lowerMsg.includes("take your medication");
          
          if (!msg || (language === "ta" && isDefaultEnglish)) {
            msg = `${t("takeTime")}: ${r.medication_name}`;
          }

          // Batch Push Notification
          if (r.reminder_type === "push") {
            sendPushNotification(
              t("medicationAlerts"),
              `${t("takeTime")}: ${r.medication_name}`
            );
          }

          // Batch Voice Notification (Single trigger as requested)
          if (r.reminder_type === "voice" || r.source === "refill") {
             messagesToSpeak.push(msg);
          }
        }
      });

      // 2. Check Low Pill Count (Refill Alerts)
      rawRefillsRef.current.forEach((r) => {
        const threshold = r.threshold || 3;
        const isLow = r.remaining_pills <= threshold;
        const key = `low-stock-alert-${r._id}`;

        if (isLow) {
          if (!lowStockAlertedIdsRef.current.has(key)) {
            lowStockAlertedIdsRef.current.add(key);
            localStorage.setItem("meditrack_low_notified", JSON.stringify([...lowStockAlertedIdsRef.current]));

            const msg = language === "ta"
              ? `${t("refillAlert") || "மறுபூரிப்பு எச்சரிக்கை"}: ${r.medication_name}, ${t("lowPills") || "மாத்திரைகள் குறைவாக உள்ளன"}: ${t("remainingPillsLabel") || "மீதமுள்ள மாத்திரைகள்"}: ${r.remaining_pills}.`
              : `Refill Alert: ${r.medication_name} is running low on pills. You have only ${r.remaining_pills} pills remaining.`;

            // Trigger once
            messagesToSpeak.push(msg);
            
            sendPushNotification(t("refillAlert") || "Refill Alert", msg);
          }
        } else {
          if (lowStockAlertedIdsRef.current.has(key)) {
            lowStockAlertedIdsRef.current.delete(key);
            localStorage.setItem("meditrack_low_notified", JSON.stringify([...lowStockAlertedIdsRef.current]));
          }
        }
      });

      // 3. Final Voice Trigger (Batched)
      if (messagesToSpeak.length > 0) {
        // Concatenate with small pauses
        const finalMsg = messagesToSpeak.join(". ");
        speakVoice(finalMsg);
      }
    }, 10000);

    return () => clearInterval(ticker);
  }, [language, t]);

  return null;
};

export default GlobalNotification;
