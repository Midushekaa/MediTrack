// backend/services/reminderSender.js
// stub: integrate push provider / SMS / voice TTS

const reminderSender = {
  send: async (reminder) => {
    console.log(
      'Sending reminder for medication',
      reminder.medication.name,
      'type',
      reminder.reminder_type
    );
    // if voice: call TTS provider and queue audio playback
    // if push: call push gateway (FCM / APNs)
    // For now mark as sent by leaving as pending and let user mark as taken.
    return true;
  },
};

export default reminderSender;
