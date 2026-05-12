import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";

// User Pages
import Splash from "./components/Splash";
import SignIn from "./components/SignIn";
import SignUp from "./components/SignUp";
import Onboarding from "./components/Onboarding";
import Dashboard from "./components/Dashboard";
import MedicationDetails from "./components/MedicationDetails";
import MedicationManagement from "./components/MedicationManagement";
import NotificationSettings from "./components/NotificationSettings";
import Analytics from "./components/Analytics";
import MissedDosePage from "./components/MissedDosePage";
import RefillReminder from "./components/RefillReminder";
import AddMedication from "./components/AddMedication";
import Profile from "./components/Profile";
import NotifyMe from "./components/NotifyMe";
import RefillNotification from "./components/RefillNotification";
import ResetPassword from "./components/ResetPassword";
import DoctorReport from "./components/DoctorReport";
import QRView from "./components/QRView";

// Admin Pages
import AdminSignIn from "./components/AdminSignIn";
import AdminDashboard from "./components/AdminDashboard";


// Footer
import Footer from "./components/Footer";

// Settings Context
import { SettingsProvider } from "./components/SettingsContext";

// Global Notification
import GlobalNotification from "./components/GlobalNotification";

function AppWrapper() {
  const location = useLocation();

  // Paths where footer should NOT appear
  const hideFooterPaths = [
    "/", 
    "/signin", 
    "/signup",
    "/admin", 
    "/admin-dashboard",
    "/reset-password/:token"
  ];

  const showFooter = !hideFooterPaths.includes(location.pathname);

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Splash />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* User Routes */}
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/medication" element={<MedicationManagement />} />
        <Route path="/details" element={<MedicationDetails />} />
        <Route path="/notifications" element={<NotificationSettings />} />
        <Route path="/notify" element={<NotifyMe />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/missed-doses" element={<MissedDosePage />} />
        <Route path="/refill-reminder" element={<RefillReminder />} />
        <Route path="/add-medication" element={<AddMedication />} />
        <Route path="/edit-medication/:id" element={<AddMedication />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/refill-notifications" element={<RefillNotification />} />
        <Route path="/doctor-report" element={<DoctorReport />} />
        <Route path="/qr-view/:userId" element={<QRView />} />

         <Route path="/reset-password" element={<ResetPassword />} />


        {/* Admin Routes */}
        <Route path="/admin" element={<AdminSignIn />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {showFooter && <Footer />}
      <GlobalNotification />
    </>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <Router>
        <AppWrapper />
      </Router>
    </SettingsProvider>
  );
}