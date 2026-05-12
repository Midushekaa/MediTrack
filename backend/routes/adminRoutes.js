import express from "express";
import User from "../models/User.js";
import Medication from "../models/Medication.js";
import Reminder from "../models/Reminder.js";
import Activity from "../models/Activity.js";
import RefillReminder from "../models/RefillReminder.js";
import Admin from "../models/Admin.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const router = express.Router();

// Middleware for Admin Auth
const authAdmin = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded; // The admin payload
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

// Get Dashboard Stats
router.get("/stats", authAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    const medications = await Medication.find().sort({ createdAt: -1 });
    const reminders = await Reminder.find().sort({ createdAt: -1 });
    const refillData = await RefillReminder.find();

    // Create a lookup map for user names
    const userMap = {};
    users.forEach(u => {
      const idStr = u._id.toString();
      // Priority: fullName > email > ID
      userMap[idStr] = u.fullName || u.email || idStr;
    });

    // Helper to attach patient name
    const attachPatient = (item) => {
      const doc = item.toObject ? item.toObject() : item;
      const uId = (doc.user?._id || doc.user || "").toString();

      return {
        ...doc,
        patientName: userMap[uId] || "Patient #" + uId.slice(-4)
      };
    };

    const medicationsWithUser = medications.map(attachPatient);
    const remindersWithUser = reminders.map(attachPatient);
    const refillsWithUser = refillData.map(attachPatient);

    // Compute missed doses and pending items from both collections
    const medMissed = medicationsWithUser.filter(m => m.status === "missed" || m.status === "skipped").length;
    const remMissed = remindersWithUser.filter(r => r.status === "missed" || r.status === "skipped").length;
    const missedCount = medMissed + remMissed;

    const medPending = medicationsWithUser.filter(m => m.status === "pending" || !m.status).map(m => ({
      ...m,
      medicationName: m.name,
      reminder_time: m.scheduleTime || m.time,
      source: "medication",
      patientName: m.patientName // Ensure it's passed through
    }));
    const remPending = remindersWithUser.filter(r => r.status === "pending").map(r => ({
      ...r,
      medicationName: r.medication_name,
      source: "reminder",
      patientName: r.patientName // Ensure it's passed through
    }));

    const upcomingReminders = [...medPending, ...remPending];

    // Compute refill alerts from both Medication and RefillReminder collections
    const medRefills = medicationsWithUser.filter(m => m.totalQuantity !== undefined && Number(m.totalQuantity) <= (Number(m.threshold) || 3));
    const dedicatedRefills = refillsWithUser.filter(r => Number(r.remaining_pills) <= (Number(r.threshold) || 3));

    // Create a unique set of medication names that need refilling
    const uniqueRefillNames = new Set([
      ...medRefills.map(m => (m.name || "").trim().toLowerCase()),
      ...dedicatedRefills.map(r => (r.medication_name || "").trim().toLowerCase())
    ].filter(Boolean));

    console.log(`REFILL SYNC: MedRefills: ${medRefills.length}, Dedicated: ${dedicatedRefills.length}, Unique Total: ${uniqueRefillNames.size}`);

    res.json({
      users,
      medications: medicationsWithUser,
      reminders: remindersWithUser,
      upcomingReminders,
      missedCount,
      refillAlertsCount: uniqueRefillNames.size,
      refillAlertNames: Array.from(uniqueRefillNames),
      aiRiskAlertsCount: 0
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

// Edit User
router.put("/users/:id", authAdmin, async (req, res) => {
  try {
    const { fullName, email } = req.body;

    // Use findByIdAndUpdate to avoid validation on missing legacy fields
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ...(fullName && { fullName }),
          ...(email && { email })
        }
      },
      { new: true, runValidators: false }
    );

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    // Log activity
    await Activity.create({
      action: "Admin Profile Update",
      user: updatedUser.email,
      details: `Updated profile for user: ${updatedUser.fullName || updatedUser.email}`,
      status: "Success"
    });

    res.json(updatedUser);
  } catch (err) {
    console.error("Edit user error:", err);
    res.status(500).json({ message: "Server error updating user" });
  }
});

// Toggle User Active Status
router.patch("/users/:id/toggle-active", authAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const currentStatus = user.isActive === undefined ? true : user.isActive;

    // Use findByIdAndUpdate to bypass validation of other fields (like fullName on legacy users)
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: !currentStatus },
      { new: true }
    );

    // Log activity
    await Activity.create({
      action: updatedUser.isActive ? "User Activated" : "User Deactivated",
      user: updatedUser.email,
      details: `Admin toggled active status for ${updatedUser.email}`,
      status: updatedUser.isActive ? "Success" : "Warning"
    });

    res.json(updatedUser);
  } catch (err) {
    console.error("Toggle user error:", err);
    res.status(500).json({ message: "Server error toggling user status" });
  }
});

// Get Recent System Activities (Dynamic Logs)
router.get("/activities", authAdmin, async (req, res) => {
  try {
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5);
    const recentMeds = await Medication.find().sort({ createdAt: -1 }).limit(5);
    const recentReminders = await Reminder.find({ status: { $ne: "pending" } }).sort({ updatedAt: -1 }).limit(5);
    const manualLogs = await Activity.find().sort({ createdAt: -1 }).limit(10);

    const logs = [];

    recentUsers.forEach(u => {
      logs.push({
        id: `u-${u._id}`,
        action: "New User Registered",
        user: u.fullName || u.email,
        time: u.createdAt,
        status: "Success"
      });
    });

    recentMeds.forEach(m => {
      logs.push({
        id: `m-${m._id}`,
        action: "Medication Added",
        user: "System/Admin",
        time: m.createdAt,
        status: "Success"
      });
    });

    recentReminders.forEach(r => {
      logs.push({
        id: `r-${r._id}`,
        action: `Dose marked as ${r.status}`,
        user: r.medication_name || "Patient",
        time: r.updatedAt,
        status: r.status === "taken" ? "Success" : "Warning"
      });
    });

    manualLogs.forEach(l => {
      logs.push({
        id: `a-${l._id}`,
        action: l.action,
        user: l.user,
        time: l.createdAt,
        status: l.status
      });
    });

    // Sort by time descending
    logs.sort((a, b) => new Date(b.time) - new Date(a.time));

    res.json(logs.slice(0, 20));
  } catch (err) {
    console.error("Activities error:", err);
    res.status(500).json({ message: "Failed to fetch activities" });
  }
});

// Add Custom Activity Log
router.post("/log", authAdmin, async (req, res) => {
  try {
    const { action, details, status } = req.body;
    const newLog = await Activity.create({
      action,
      user: req.admin.email || "Admin",
      details,
      status: status || "Success"
    });
    res.json(newLog);
  } catch (err) {
    console.error("Log creation error:", err);
    res.status(500).json({ message: "Failed to create log" });
  }
});

// Admin Change Password
router.post("/change-password", authAdmin, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const admin = await Admin.findById(req.admin.id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    // Verify old password
    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) return res.status(400).json({ message: "Incorrect current password" });

    admin.password = newPassword;
    await admin.save();

    // Log the security action
    await Activity.create({
      action: "Admin Password Changed",
      user: admin.email,
      details: "Security credentials updated via dashboard.",
      status: "Success"
    });

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Password change error:", err);
    res.status(500).json({ message: "Server error updating password" });
  }
});

// GET Admin Profile
router.get("/profile", authAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select("-password");
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    // Map fullName to the structure expected by the frontend
    res.json({
      firstName: admin.fullName.split(" ")[0] || admin.fullName,
      lastName: admin.fullName.split(" ").slice(1).join(" ") || "",
      email: admin.email,
      fullName: admin.fullName,
      role: "Super Admin"
    });
  } catch (err) {
    console.error("Admin profile error:", err);
    res.status(500).json({ message: "Server error fetching profile" });
  }
});

export default router;
