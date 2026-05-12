import axios from "axios";

const baseURL = window.location.hostname === "localhost" 
  ? "http://localhost:5000/api" 
  : `http://${window.location.hostname}:5000/api`;

const api = axios.create({
  baseURL,
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
