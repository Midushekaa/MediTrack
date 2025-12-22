import gTTS from "gtts";

export const generateVoiceReminder = async (reminder) => {
  const text = `Hi! It's time to take your medication ${reminder.medName}.`;
  const fileName = `uploads/voice_${Date.now()}.mp3`;

  const gtts = new gTTS(text, "en");
  await new Promise((resolve, reject) => {
    gtts.save(fileName, (err) => (err ? reject(err) : resolve()));
  });

  return fileName;
};
