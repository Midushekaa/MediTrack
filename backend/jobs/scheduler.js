import cron from "node-cron";
import Reminder from "../models/Reminder.js";
import reminderSender from "../services/reminderSender.js";

/**
 * Starts the reminder scheduler.
 * This cron job runs every minute and sends due reminders.
 */
export function startReminderScheduler() {
  // Cron: every minute
  cron.schedule("* * * * *", async () => {
    const now = new Date();

    try {
      // Find pending reminders due now
      const dueReminders = await Reminder.find({
        reminder_time: { $lte: now.toISOString().slice(11,16) }, // "HH:MM" format
        status: "pending"
      }).populate("medication_id"); // ✅ use correct schema field

      if (dueReminders.length === 0) return;

      for (const reminder of dueReminders) {
        try {
          // Send the reminder via your service
          await reminderSender.send(reminder);

          // Update status to "taken" after sending
          reminder.status = "taken";
          reminder.updated_at = new Date();
          await reminder.save();

          console.log(
            `Reminder sent for medication: ${reminder.medication_id?.name} at ${reminder.reminder_time}`
          );
        } catch (sendErr) {
          console.error(
            `Failed to send reminder for ${reminder.medication_id?.name}:`,
            sendErr
          );
        }
      }
    } catch (err) {
      console.error("Scheduler error:", err);
    }
  });

  console.log("Reminder scheduler started...");
}
