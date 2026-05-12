import axios from 'axios';

async function runTest() {
  try {
    // 1. Register a test user
    const ts = Date.now();
    const email = `test${ts}@example.com`;
    const password = "password123";
    
    await axios.post("http://localhost:5000/api/users/register", {
      name: "Test User",
      email,
      password
    }).catch(e => e); // ignore if already exists or fails

    // 2. Login
    const loginRes = await axios.post("http://localhost:5000/api/users/login", {
      email,
      password
    });
    
    const token = loginRes.data.token;
    console.log("Got token:", token);

    // 3. Post reminder
    const reminderData = {
      medication_name: "Test Med",
      reminder_time: "14:00",
      reminder_type: "push",
      voice_prompt: "Test voice prompt"
    };

    const res = await axios.post("http://localhost:5000/api/reminders", reminderData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Success:", res.data);
  } catch (err) {
    if (err.response) {
      console.error("Backend returned error:", err.response.status, err.response.data);
    } else {
      console.error("Request failed:", err.message);
    }
  }
}

runTest();
