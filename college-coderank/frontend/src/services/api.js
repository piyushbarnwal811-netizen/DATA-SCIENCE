import axios from "axios";

// Dynamically determine the backend root URL (Next.js, Vite, or CRA compatible) with localhost fallback
const RAW_API_URL =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ||
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
  (typeof process !== "undefined" && process.env?.REACT_APP_API_URL) ||
  "http://localhost:5000";

// Base server origin without trailing slashes
export const API_URL = RAW_API_URL.replace(/\/+$/, "");

// API base URL for route endpoints (guarantees /api prefix)
export const API_BASE_URL = API_URL.endsWith("/api") ? API_URL : `${API_URL}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json"
  }
});

api.interceptors.request.use((config) => {
  config.headers = config.headers || {};

  // For FormData uploads, let the browser handle multipart boundary headers automatically
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  // Attach token if present
  const token = typeof window !== "undefined" ? localStorage.getItem("ccr_token") : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Normalize URLs to prevent duplicate /api prefix if caller passes /api/...
  if (config.url) {
    if (config.url.startsWith("/api/")) {
      config.url = config.url.replace(/^\/api/, "");
    } else if (config.url.startsWith("api/")) {
      config.url = config.url.replace(/^api/, "");
    } else if (config.url === "/api" || config.url === "api") {
      config.url = "";
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined" && localStorage.getItem("ccr_token")) {
      localStorage.removeItem("ccr_token");
      localStorage.removeItem("ccr_user");
      window.dispatchEvent(new Event("ccr:unauthorized"));
    }
    return Promise.reject(error);
  }
);

export const checkHealth = () => api.get("/health");

export const errorMessage = (error, fallback = "Something went wrong. Please try again.") => {
  if (error.response?.data?.message) return error.response.data.message;
  if (!error.response || error.response.status >= 500) {
    return "The API is unavailable. Please check the backend service and try again.";
  }
  return error.message || fallback;
};

export default api;