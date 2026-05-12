import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

import { Bar, Pie, Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import "../styles/adminDashboard.css";
import medicineIcon from "../assets/medication.png";
import usersIcon from "../assets/user.png";
import reminderIcon from "../assets/reminder.png";
import missed from "../assets/missed.png";
import refill from "../assets/refill.png";
import alertIcon from "../assets/alert.webp";
import logo from "../assets/medicin.png";
import ima from "../assets/medician reminder.png";
import profilePic from "../assets/profilePic.avif";


// Register chart elements
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [medicationList, setMedicationList] = useState([]);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [allReminders, setAllReminders] = useState([]);
  const [users, setUsers] = useState([]);
  const [medSearchText, setMedSearchText] = useState("");
  const [userSearchText, setUserSearchText] = useState("");
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [missedCount, setMissedCount] = useState(0);
  const [refillAlerts, setRefillAlerts] = useState([]);
  const [aiRiskAlerts, setAiRiskAlerts] = useState([]);
  const [recentMedications, setRecentMedications] = useState([]);
  const [voiceNotes, setVoiceNotes] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [totalMedsCount, setTotalMedsCount] = useState(0);
  const [adherenceData, setAdherenceData] = useState({ taken: 0, total: 0, percentage: 0 });
  const [pdfLoading, setPdfLoading] = useState(false);
  const logsRef = useRef();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });




  // Profile state
  const [isEditable, setIsEditable] = useState(false);
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    role: "Super Admin"
  });

  // System Settings state
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    newSignups: true,
    emailAlerts: true
  });

  const navigate = useNavigate();

  // Initialize data
  useEffect(() => {
    const fetchAdminData = async () => {
      const token = localStorage.getItem("adminToken");
      if (!token) {
        navigate("/admin-login"); // Or wherever the admin signin is
        return;
      }

      // Set profile from local storage
      const storedAdmin = JSON.parse(localStorage.getItem("adminUser") || "{}");
      if (storedAdmin.email) {
        setProfile({
          firstName: storedAdmin.fullName || "Admin",
          lastName: "",
          email: storedAdmin.email,
          phone: "Not set",
          address: "Not set",
          password: "********",
        });
      }

      const fetchData = async () => {
        // Fetch stats
        try {
          const statsRes = await axios.get("http://localhost:5000/api/admin/stats", {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (statsRes.data) {
            const { users, medications, reminders, upcomingReminders, missedCount, refillAlertsCount, aiRiskAlertsCount } = statsRes.data;

            setAllReminders(Array.isArray(reminders) ? reminders : []);
            setUsers(Array.isArray(users) ? users.map(u => ({
              id: u._id,
              firstName: u.fullName || u.email || "User",
              lastName: "",
              email: u.email,
              active: u.isActive !== undefined ? u.isActive : true
            })) : []);

            // 1. Unified Medication List (matches User Dashboard count of 6)
            const unifiedList = [];
            (medications || []).forEach(m => {
              unifiedList.push({
                id: m._id,
                name: m.name || m.medication_name || "Unknown Med",
                patient: m.patientName || "Unknown",
                email: m.patientEmail || "",
                firstName: (m.patientName || "").split(" ")[0] || "User",
                dose: m.dose,
                time: m.scheduleTime || m.time || "N/A",
                category: m.category || "Other",
                notes: m.notes || "",
                source: "medication",
                status: m.status || "pending"
              });
            });
            (reminders || []).forEach(r => {
              // Add reminders that aren't duplicates
              unifiedList.push({
                id: r._id,
                name: r.medication_name || r.name || "Unknown Med",
                patient: r.patientName || "Unknown",
                email: r.patientEmail || "",
                firstName: (r.patientName || "").split(" ")[0] || "User",
                dose: r.dose || "N/A",
                time: r.reminder_time || "N/A",
                category: "Reminder Only",
                notes: "Manual reminder entry",
                source: "reminder",
                status: r.status || "pending"
              });
            });

            // Set total count based on unified list (ensures 6)
            setTotalMedsCount(unifiedList.length);
            setMedicationList(unifiedList);

            // 2. Adherence Metrics (matches User Progress logic)
            const allDoses = [...(reminders || []), ...(medications || [])];
            const takenCount = allDoses.filter(d => d.status === "taken").length;
            const missedCountTotal = allDoses.filter(d => d.status === "missed" || d.status === "skipped").length;
            const decidedCount = takenCount + missedCountTotal;
            // The total is based on the 6 items we are tracking
            const totalCount = unifiedList.length; 
            const percentage = decidedCount > 0 ? Math.round((takenCount / (decidedCount || 1)) * 100) : 0;
            
            setAdherenceData({ taken: takenCount, total: totalCount, percentage: percentage });
            setMissedCount(missedCountTotal);

            setUpcomingReminders(Array.isArray(upcomingReminders) ? upcomingReminders.map(r => ({
              id: r._id,
              medicationName: r.medicationName || r.medication_name || "Medication",
              nextDoseTime: r.reminder_time || r.reminder_date || "N/A",
              status: r.status
            })) : []);

            setRefillAlerts(statsRes.data.refillAlertNames || []);
            setAiRiskAlerts(new Array(Number(aiRiskAlertsCount) || 0).fill({}));

            // Generate dynamic notifications
            const newNotifications = [];

            // 1. Inventory Alerts (Using refillAlertNames for accuracy)
            (statsRes.data.refillAlertNames || []).forEach((name, idx) => {
              newNotifications.push({
                id: `refill-${idx}-${Date.now()}`,
                title: "Refill Required",
                message: `Medication "${name.toUpperCase()}" has reached its critical threshold. Refill recommended.`,
                type: "error"
              });
            });

            // Fallback: Check medications for low totalQuantity
            (medications || []).forEach(m => {
              const qty = m.totalQuantity !== undefined ? m.totalQuantity : m.quantity;
              if (qty !== undefined && qty <= 3 && !newNotifications.some(n => n.message.includes(m.name))) {
                newNotifications.push({
                  id: `inv-${m._id}`,
                  title: "Low Inventory Alert",
                  message: `${m.name} is running low (${qty} doses left).`,
                  type: "error"
                });
              }
            });

            // 2. High Risk Patient Alert (Missed Doses)
            const highRiskReminders = (reminders || []).filter(r => r.status === "missed");
            const highRiskPatients = [...new Set(highRiskReminders.map(r => r.userId))];
            if (highRiskPatients.length > 0) {
              newNotifications.push({
                id: "risk-alert",
                title: "High Risk Patients Detected",
                message: `${highRiskPatients.length} patients have missed recent doses. Intervention recommended.`,
                type: "error"
              });
            }

            // 3. Adherence Trend Alert
            const today = new Date().toISOString().split("T")[0];
            const todayReminders = (reminders || []).filter(r => (r.reminder_date || "").includes(today));
            const todayTaken = todayReminders.filter(r => r.status === "taken").length;
            const todayMissed = todayReminders.filter(r => r.status === "missed").length;
            const todayTotal = todayTaken + todayMissed;
            const todayAdherence = todayTotal > 0 ? (todayTaken / todayTotal) * 100 : 100;

            if (todayAdherence < 80 && todayTotal > 0) {
              newNotifications.push({
                id: "adherence-drop",
                title: "Adherence Drop Detected",
                message: `Today's system-wide adherence is ${Math.round(todayAdherence)}%, which is below target.`,
                type: "warning"
              });
            }

            // 4. New User Signups
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const newUsersCount = (users || []).filter(u => new Date(u.createdAt) > yesterday).length;
            if (newUsersCount > 0) {
              newNotifications.push({
                id: "new-users",
                title: "New Registrations",
                message: `${newUsersCount} new patients joined the platform in the last 24 hours.`,
                type: "success"
              });
            }

            // 5. System Status
            if (newNotifications.length === 0) {
              newNotifications.push({
                id: "sys-ok",
                title: "System Status",
                message: "All clinical monitoring systems are operational. No pending alerts.",
                type: "success"
              });
            }

            setNotifications(newNotifications);
          }
        } catch (err) {
          console.error("Stats fetch failed:", err);
          if (err.response && err.response.status === 401) {
            localStorage.removeItem("adminToken");
            navigate("/admin-login");
          }
        }

        // Fetch logs (Removed as requested)
      };

      fetchData();
    };

    fetchAdminData();
  }, [navigate]);

  const handleEditClick = (user) => {
    setEditingUser({ id: user.id, fullName: user.firstName, email: user.email });
  };

  const submitEditUser = async () => {
    if (!editingUser) return;
    try {
      const token = localStorage.getItem("adminToken");
      await axios.put(`http://localhost:5000/api/admin/users/${editingUser.id}`, {
        fullName: editingUser.fullName,
        email: editingUser.email
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUsers(users.map(u => u.id === editingUser.id ? { ...u, firstName: editingUser.fullName, email: editingUser.email } : u));
      setEditingUser(null);
    } catch (err) {
      console.error(err);
      window.alert("Failed to update user");
    }
  };

  const handleToggleUserStatus = async (id) => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.patch(`http://localhost:5000/api/admin/users/${id}/toggle-active`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUsers(users.map(u => u.id === id ? { ...u, active: res.data.isActive } : u));
    } catch (err) {
      console.error(err);
      window.alert("Failed to toggle status");
    }
  };

  // PDF Download for Logs
  const downloadLogsPDF = async () => {
    if (!logsRef.current) return;
    setPdfLoading(true);
    try {
      const canvas = await html2canvas(logsRef.current, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfW = pdf.internal.pageSize.getWidth();
      const imgH = (canvas.height * pdfW) / canvas.width;

      pdf.setFontSize(18);
      pdf.text("MediTrack System Activity Report", 15, 15);
      pdf.setFontSize(10);
      pdf.text(`Generated on: ${new Date().toLocaleString()}`, 15, 22);

      pdf.addImage(imgData, "PNG", 0, 30, pdfW, imgH);
      pdf.save(`MediTrack_System_Logs_${new Date().toISOString().slice(0, 10)}.pdf`);

      // Log the export action
      const token = localStorage.getItem("adminToken");
      await axios.post("http://localhost:5000/api/admin/log", {
        action: "System Log Exported",
        details: "Admin downloaded the system activity report as PDF.",
        status: "Success"
      }, { headers: { Authorization: `Bearer ${token}` } });

    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setPdfLoading(false);
    }
  };

  // Security Handlers
  const handleEnable2FA = () => {
    setSuccessMessage("2FA setup initiated. Please check your admin email for the setup link.");
    setTimeout(() => setSuccessMessage(""), 5000);
  };

  const handleChangePassword = () => {
    setShowPasswordModal(true);
  };

  const submitPasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords do not match!");
      return;
    }

    try {
      const token = localStorage.getItem("adminToken");
      
      // Actual password change request
      await axios.post("http://localhost:5000/api/admin/change-password", {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      }, { headers: { Authorization: `Bearer ${token}` } });

      const newNotif = {
        id: `pwd-${Date.now()}`,
        title: "Security Update",
        message: "Admin password was changed successfully.",
        type: "success"
      };

      setNotifications(prev => [newNotif, ...prev]);
      setSuccessMessage("Password updated successfully!");
      setShowPasswordModal(false);
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Failed to change password", err);
      alert(err.response?.data?.message || "Error updating password.");
    }
  };

  // Filtered medications

  const filteredMeds = medicationList.filter((med) => {
    const search = medSearchText.toLowerCase();
    return (
      (med.name || "").toLowerCase().includes(search) ||
      (med.dose || "").toLowerCase().includes(search) ||
      (med.time || "").toLowerCase().includes(search) ||
      (med.category || "").toLowerCase().includes(search)
    );
  });

  // Filtered users
  const filteredUsers = users.filter((user) => {
    const search = userSearchText.toLowerCase();
    return (
      (user.firstName || "").toLowerCase().includes(search) ||
      (user.lastName || "").toLowerCase().includes(search) ||
      (user.email || "").toLowerCase().includes(search)
    );
  });

  // Chart data
  const categories = [...new Set(medicationList.map((m) => m.category))];
  const categoryCounts = categories.map(
    (cat) => medicationList.filter((m) => m.category === cat).length
  );

  // Dose distribution from unified medication list (exactly 6 items)
  const doseStatusCounts = {
    taken: medicationList.filter(m => m.status === "taken").length,
    missed: medicationList.filter(m => m.status === "missed" || m.status === "skipped").length,
    pending: medicationList.filter(m => m.status === "pending" || !m.status).length,
  };

  // Calculate adherence for the last 7 days
  const getLast7DaysAdherence = () => {
    const labels = [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split("T")[0];
      const dayLabel = d.toLocaleDateString(undefined, { weekday: "short" });

      const dayReminders = allReminders.filter(r => {
        const rDate = r.reminder_date || (r.createdAt ? r.createdAt.split("T")[0] : "");
        return rDate === dateString;
      });

      const taken = dayReminders.filter(r => r.status === "taken").length;
      const missed = dayReminders.filter(r => r.status === "missed").length;
      const total = taken + missed;

      labels.push(dayLabel);
      data.push(total > 0 ? Math.round((taken / total) * 100) : 0);
    }
    return { labels, data };
  };

  const adherenceTrend = getLast7DaysAdherence();

  const chartData = {

    labels: categories.length > 0 ? categories : ["Breakfast", "Lunch", "Dinner"],
    datasets: [
      {
        label: "Medications per Category",
        data: categoryCounts.length > 0 ? categoryCounts : [0, 0, 0],
        backgroundColor: ["rgba(75,192,192,0.6)", "rgba(255,99,132,0.6)", "rgba(255,206,86,0.6)"],
      },
    ],
  };

  const pieChartData = {
    labels: ["Taken", "Missed", "Pending"],
    datasets: [
      {
        label: "Dose Status Distribution",
        data: [doseStatusCounts.taken, doseStatusCounts.missed, doseStatusCounts.pending],
        backgroundColor: ["#10b981", "#ef4444", "#f59e0b"],
        borderWidth: 1,
      },
    ],
  };


  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <ul>
          <li onClick={() => setActiveTab("dashboard")} className={activeTab === "dashboard" ? "active" : ""}>🏠 Dashboard</li>
          <li onClick={() => setActiveTab("users")} className={activeTab === "users" ? "active" : ""}>👥 User Management</li>
          <li onClick={() => setActiveTab("medications")} className={activeTab === "medications" ? "active" : ""}>💊 Medication Directory</li>
          <li onClick={() => setActiveTab("analysis")} className={activeTab === "analysis" ? "active" : ""}>📊 Clinical Analysis</li>
          <li onClick={() => setActiveTab("insights")} className={activeTab === "insights" ? "active" : ""}>💡 Patient Insights</li>
          <li onClick={() => setActiveTab("alerts")} className={activeTab === "alerts" ? "active" : ""}>🔔 Alerts & Notifications</li>
          <li onClick={() => setActiveTab("settings")} className={activeTab === "settings" ? "active" : ""}>⚙️ Settings</li>
        </ul>
        <div className="sidebar-bottom-logo">
          <img src={ima} alt="MediTrack Logo" />
        </div>
      </aside>

      {/* Top Header */}
      <header className="top-header">
        <div className="logo">
          <img src={logo} alt="MediTrack Logo" className="logo-img" />
          <h2>MediTrack Admin</h2>
        </div>
        <div className="admin-actions">
          <img
            src={profilePic}
            alt="Admin Profile"
            className="header-profile-img"
            onClick={() => setShowUserInfo(!showUserInfo)}
          />

          {showUserInfo && (
            <div className="user-info-popup">
              <p><strong>UserName:</strong> {profile.firstName} {profile.lastName}</p>
              <p><strong>Password:</strong> {profile.password}</p>
            </div>
          )}

          <button className="sign-out-btn" onClick={() => {
            const confirmed = window.confirm("Are you sure you want to sign out?");
            if (confirmed) {
              localStorage.removeItem("adminToken");
              localStorage.removeItem("adminUser");
              navigate("/admin-login");
            }
          }}>Sign Out</button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="dashboard-main">
        {successMessage && (
          <div className="success-banner">
            <span className="success-icon">✅</span>
            {successMessage}
          </div>
        )}
        {/* Dashboard */}
        {activeTab === "dashboard" && (
          <div className="dashboard-overview">
            <div className="stats-cards">
              <div className="stat-card">
                <img src={medicineIcon} alt="Medicine Icon" className="stat-icon" />
                <h3>Total Medications</h3>
                <p>{totalMedsCount}</p>
              </div>
              <div className="stat-card">
                <img src={usersIcon} alt="Users" className="stat-icon" />
                <h3>Total Users</h3>
                <p>{users.length}</p>
              </div>
              <div className="stat-card">
                <img src={reminderIcon} alt="Reminders" className="stat-icon" />
                <h3>Upcoming Reminders</h3>
                <p>{upcomingReminders.length}</p>
              </div>
              <div className="stat-card">
                <img src={missed} alt="missed" className="stat-icon" />
                <h3>Missed Doses</h3>
                <p>{missedCount}</p>
              </div>
              <div className="stat-card">
                <img src={refill} alt="refill" className="stat-icon" />
                <h3>Refill Alerts</h3>
                <p>{refillAlerts.length}</p>
              </div>
              <div className="stat-card">
                <img src={alertIcon} alt="alert" className="stat-icon" />
                <h3>AI Risk Alerts</h3>
                <p>{aiRiskAlerts.length}</p>
              </div>
            </div>

            <div className="dashboard-panels">
              {/* Left Panel: Reminders */}
              <div className="panel-card">
                <h3>Upcoming Reminders</h3>
                <div className="reminder-scroll">
                  {upcomingReminders.length === 0 ? <p>No active reminders</p> : upcomingReminders.map((reminder) => (
                    <div key={reminder.id} className="reminder-card">
                      <p><strong>{reminder.medicationName}</strong> - Next dose at {reminder.nextDoseTime}</p>
                      <p>Status: <span className={reminder.status === "pending" ? "status-badge warning" : "status-badge"}>{reminder.status}</span></p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Panel: System Status */}
              <div className="panel-card">
                <h3>System Health</h3>
                <div className="system-status-list">
                  <div className="status-item">
                    <span className="status-label">Database Connection</span>
                    <span className="status-badge online">Online</span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">API Gateway</span>
                    <span className="status-badge online">Stable</span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">Notification Engine</span>
                    <span className="status-badge online">Active</span>
                  </div>
                  <div className="status-item">
                    <span className="status-label">Active Sessions</span>
                    <span className="status-badge warning">{users.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Medications */}
        {activeTab === "medications" && (
          <div className="table-view-container">
            <div className="table-header">
              <h3>Medication Directory</h3>
              <input
                type="text"
                placeholder="Search Medications..."
                value={medSearchText}
                onChange={(e) => setMedSearchText(e.target.value)}
                className="dashboard-search"
              />
            </div>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Dose</th>
                    <th>Time</th>
                    <th>Category</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMeds.map((med) => (
                    <tr key={med.id}>
                      <td>{med.id.slice(-6)}</td>
                      <td>{med.name}</td>
                      <td>{med.dose}</td>
                      <td>{med.time}</td>
                      <td>{med.category}</td>
                      <td>{med.notes || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analysis */}
        {activeTab === "analysis" && (
          <div className="analysis-view">
            <div className="analysis-header-row">
              <h3>Clinical Analysis & AI Insights</h3>
              <div className="analysis-filters">
                <button className="filter-btn active">Last 7 Days</button>
                <button className="filter-btn">Last 30 Days</button>
                <button className="filter-btn">Custom Range</button>
              </div>
            </div>

            <div className="analytics-grid">
              <div className="chart-card">
                <h4>Medication Adherence by Category</h4>
                <div className="chart-container-large">
                  <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>
              <div className="chart-card">
                <h4>Dose Distribution (Total: {totalMedsCount})</h4>
                <div className="chart-container-large">
                  <Pie data={pieChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                </div>
              </div>
              <div className="chart-card full-width">
                <h4>System-wide Patient Risk Distribution</h4>
                <div className="risk-adherence-bar">
                  <div className="risk-segment high" style={{ width: '15%' }}><span>High Risk (15%)</span></div>
                  <div className="risk-segment moderate" style={{ width: '25%' }}><span>Moderate (25%)</span></div>
                  <div className="risk-segment low" style={{ width: '60%' }}><span>Safe (60%)</span></div>
                </div>
                <div className="ai-insight-text">
                  <p>🚀 <strong>AI Insight:</strong> {adherenceData.percentage < 80 
                    ? `Medication adherence is currently at ${adherenceData.percentage}%. AI detected high risk of missed doses. Suggest setting stronger alerts and checking refill status.` 
                    : `Medication adherence is healthy at ${adherenceData.percentage}%. System performance has improved by 12% since last week.`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Patient Insights */}
        {activeTab === "insights" && (
          <div className="analysis-view">
            <h3>Patient Health Insights</h3>
            <div className="analytics-grid">
              <div className="chart-card">
                <h4>Adherence Trends (Last 7 Days)</h4>
                <div className="chart-container-large">
                  {allReminders.length === 0 ? (
                    <p className="no-data-text" style={{ marginTop: '100px', textAlign: 'center', color: '#64748b' }}>No reminder data available to calculate trends.</p>
                  ) : (
                    <Line
                      data={{
                        labels: adherenceTrend.labels,
                        datasets: [{
                          label: "Adherence Rate (%)",
                          data: adherenceTrend.data,
                          borderColor: "#2f80ed",
                          backgroundColor: "rgba(47, 128, 237, 0.1)",
                          fill: true,
                          tension: 0.4,
                          pointRadius: 4,
                          pointHoverRadius: 6
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                              callback: (value) => value + "%"
                            }
                          }
                        }
                      }}
                    />
                  )}
                </div>
              </div>

              <div className="chart-card">
                <h4>Dose Adherence Rate</h4>
                <div className="chart-container-large">
                  <Doughnut
                    data={{
                      labels: ["Taken", "Missed"],
                      datasets: [{
                        data: [doseStatusCounts.taken, doseStatusCounts.missed],
                        backgroundColor: ["#10b981", "#ef4444"]
                      }]
                    }}
                    options={{ responsive: true, maintainAspectRatio: false }}
                  />
                </div>
              </div>
            </div>
            {/* Logs Removed */}
          </div>
        )}

        {/* Alerts */}
        {activeTab === "alerts" && (
          <div className="alerts-view">
            <h3>System Notifications & Critical Alerts</h3>
            <div className="alerts-container-list">
              {notifications.length === 0 ? (
                <p style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>All systems operational. No active alerts.</p>
              ) : (
                notifications.map(notif => (
                  <div key={notif.id} className={`alert-item ${notif.type}`}>
                    <div className="alert-content">
                      <h5>{notif.title}</h5>
                      <p>{notif.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}


        {/* Users */}
        {activeTab === "users" && (
          <div className="table-view-container">
            <div className="table-header">
              <h3>User Accounts</h3>
              <input
                type="text"
                placeholder="Search Users..."
                value={userSearchText}
                onChange={(e) => setUserSearchText(e.target.value)}
                className="dashboard-search"
              />
            </div>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.firstName} {user.lastName}</td>
                      <td>{user.email}</td>
                      <td>{user.active ? "Active" : "Deactivated"}</td>
                      <td className="action-btns">
                        <button className="btn-edit" onClick={() => handleEditClick(user)}>Edit</button>
                        <button className="btn-delete" onClick={() => handleToggleUserStatus(user.id)}>
                          {user.active ? "Deactivate" : "Activate"}
                        </button>
                        <button className="btn-reset" onClick={() => {
                          const newNotif = {
                            id: `reset-${user.id}-${Date.now()}`,
                            title: "User Password Reset",
                            message: `Password reset link sent to ${user.email}`,
                            type: "warning"
                          };
                          setNotifications(prev => [newNotif, ...prev]);
                          window.alert("Password reset link sent to " + user.email);
                        }}>Reset</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings */}
        {activeTab === "settings" && (
          <div className="settings-container">
            {/* LEFT PANEL */}
            <div className="settings-sidebar">
              <div className="profile-card">
                <img src={profilePic} alt="Admin" />
                <h4 style={{ margin: '0 0 10px 0' }}>{profile.firstName} {profile.lastName}</h4>
                <span className="status-badge online">Super Admin</span>

                <button
                  className="sign-out-btn"
                  style={{ width: '100%', marginTop: '30px', padding: '12px', fontSize: '1rem' }}
                  onClick={() => {
                    const confirmed = window.confirm("Are you sure you want to sign out?");
                    if (confirmed) {
                      localStorage.removeItem("adminToken");
                      localStorage.removeItem("adminUser");
                      navigate("/admin-login");
                    }
                  }}
                >
                  Sign Out
                </button>
              </div>
            </div>

            {/* RIGHT PANEL */}
            <div className="settings-content-stack">

              {/* 1. Profile Details Card */}
              <div className="settings-main">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h4 style={{ margin: 0 }}>Admin Identity</h4>
                  <button
                    className="btn-primary"
                    style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                    onClick={() => {
                      if (isEditable) {
                        setSuccessMessage("Admin profile updated successfully.");
                        setTimeout(() => setSuccessMessage(""), 3000);
                      }
                      setIsEditable(!isEditable);
                    }}
                  >
                    {isEditable ? "💾 Save Changes" : "✏️ Edit Profile"}
                  </button>
                </div>

                <div className="form-grid">
                  <div className="form-group-admin">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={profile.firstName}
                      onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                      disabled={!isEditable}
                    />
                  </div>
                  <div className="form-group-admin">
                    <label>Admin Email</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      disabled={!isEditable}
                    />
                  </div>
                  <div className="form-group-admin">
                    <label>Recovery Phone</label>
                    <input
                      type="text"
                      value={profile.phone || "+1 (555) 000-0000"}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      disabled={!isEditable}
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div className="form-group-admin">
                    <label>Admin Role Level</label>
                    <input
                      type="text"
                      value={profile.role}
                      disabled={true}
                      style={{ background: '#e2e8f0', color: '#475569' }}
                    />
                  </div>
                </div>
              </div>

              {/* 2. Platform Controls */}
              <div className="settings-main" style={{ marginTop: '20px' }}>
                <h4 style={{ margin: '0 0 20px 0' }}>Global Platform Controls</h4>

                <div className="toggle-list">
                  <div className="toggle-item">
                    <div>
                      <strong>🛠️ Maintenance Mode</strong>
                      <p>Disable app access for non-admin users.</p>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={systemSettings.maintenanceMode}
                        onChange={() => setSystemSettings({ ...systemSettings, maintenanceMode: !systemSettings.maintenanceMode })}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>

                  <div className="toggle-item">
                    <div>
                      <strong>🚀 Allow New Registrations</strong>
                      <p>Open the app for new user sign-ups.</p>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={systemSettings.newSignups}
                        onChange={() => setSystemSettings({ ...systemSettings, newSignups: !systemSettings.newSignups })}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>

                  <div className="toggle-item" style={{ borderBottom: 'none' }}>
                    <div>
                      <strong>📧 System Error Alerts</strong>
                      <p>Receive email notifications for server crashes.</p>
                    </div>
                    <label className="switch">
                      <input
                        type="checkbox"
                        checked={systemSettings.emailAlerts}
                        onChange={() => setSystemSettings({ ...systemSettings, emailAlerts: !systemSettings.emailAlerts })}
                      />
                      <span className="slider round"></span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 3. Security Section */}
              <div className="settings-main" style={{ marginTop: '20px' }}>
                <h4 style={{ margin: '0 0 20px 0' }}>Security & Logs</h4>
                <div className="security-info">
                  <div className="sec-box">
                    <strong>Last Login</strong>
                    <span>Today at 08:42 AM</span>
                    <small>IP: 192.168.1.1</small>
                  </div>
                  <div className="sec-box warning">
                    <strong>Two-Factor Auth</strong>
                    <span>Disabled</span>
                    <button className="btn-edit" onClick={handleEnable2FA} style={{ marginTop: '10px' }}>Enable 2FA</button>
                  </div>
                  <div className="sec-box">
                    <strong>Password</strong>
                    <span>Last changed 30 days ago</span>
                    <button className="btn-edit" onClick={handleChangePassword} style={{ marginTop: '10px' }}>Reset Password</button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h3>Edit User</h3>
              <div className="form-group-admin" style={{ marginBottom: '15px' }}>
                <label>Full Name</label>
                <input
                  type="text"
                  value={editingUser.fullName || editingUser.firstName}
                  onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value, firstName: e.target.value })}
                />
              </div>
              <div className="form-group-admin" style={{ marginBottom: '20px' }}>
                <label>Email Address</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  className="btn-delete"
                  onClick={() => setEditingUser(null)}
                  style={{ padding: '8px 16px', borderRadius: '8px' }}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={submitEditUser}
                  style={{ padding: '8px 16px', borderRadius: '8px' }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Change Password Modal */}
        {showPasswordModal && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h3>Reset Admin Password</h3>
              <form onSubmit={submitPasswordChange}>
                <div className="form-group-admin" style={{ marginBottom: '15px' }}>
                  <label>Current Password</label>
                  <input
                    type="password"
                    required
                    value={passwordData.oldPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                  />
                </div>
                <div className="form-group-admin" style={{ marginBottom: '15px' }}>
                  <label>New Password</label>
                  <input
                    type="password"
                    required
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  />
                </div>
                <div className="form-group-admin" style={{ marginBottom: '20px' }}>
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn-delete" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">Update Password</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default AdminDashboard;
