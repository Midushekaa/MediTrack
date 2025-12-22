// This file simulates predictive scoring. Replace with your ML model / API.
module.exports = {
  predictAdherence: async (userId) => {
    // simple heuristic: random for now
    const score = Math.random(); // 0..1
    return { score, message: score < 0.3 ? 'High risk of missed dose' : 'Low risk' };
  },
  generateVoiceReminderText: (medication) => {
    return `Reminder: take ${medication.dose} of ${medication.name} now.`;
  }
};
