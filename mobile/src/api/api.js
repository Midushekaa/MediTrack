import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Dynamically determine the local IP address based on Expo's hostUri
// This ensures that it works on any local network without hardcoding IPs
let HOST_IP = '192.168.1.100'; // Default fallback
if (Constants.expoConfig?.hostUri) {
  HOST_IP = Constants.expoConfig.hostUri.split(':')[0];
}

const API_URL = `http://${HOST_IP}:5000/api`;

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
export { API_URL, HOST_IP };
