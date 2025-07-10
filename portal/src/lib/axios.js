//portal/src/lib/axios.js
import axios from "axios";

// Root base URL (no /api/v1)
export const ROOT_BASE_URL = "http://localhost:2322";

const api = axios.create({
  baseURL: `${ROOT_BASE_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include authToken
api.interceptors.request.use((config) => {
  const authToken = localStorage.getItem("jwt_token");
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
