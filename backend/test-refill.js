const axios = require('axios');

async function run() {
  try {
    // Register test user
    const ts = Date.now();
    const email = `test${ts}@example.com`;
    await axios.post("http://localhost:5000/api/auth/register", {
      name: "Test User",
      email,
      password: "password123"
    }).catch(() => {});

    // Login
    const loginRes = await axios.post("http://localhost:5000/api/auth/login", {
      email,
      password: "password123"
    });
    
    const token = loginRes.data.token;
    console.log("Logged in, token:", token);

    // Create refill reminder
    const res = await axios.post("http://localhost:5000/api/refills", {
      medication_name: "Aspirin",
      remaining_pills: 10,
      threshold: 2,
      reminder_date: "2026-10-10"
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("Success! Data:", res.data);
  } catch (err) {
    if (err.response) {
      console.error("Server Error:", err.response.status, err.response.data);
    } else {
      console.error("Connection Error:", err.message);
    }
  }
}

run();
