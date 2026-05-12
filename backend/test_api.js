import axios from "axios";

const run = async () => {
  try {
    const res = await axios.get("http://localhost:5000/api/analytics");
    console.log(JSON.stringify(res.data, null, 2));
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
};

run();
