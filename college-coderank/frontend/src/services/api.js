import axios from "axios";

// Dynamically determine backend root URL with production Render fallback
const getRawApiUrl = () => {
  // 1. Explicit environment variable takes precedence in any runtime (Next.js, Vite, CRA)
  const envUrl =
    (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) ||
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) ||
    (typeof process !== "undefined" && process.env?.REACT_APP_API_URL);

  if (envUrl) {
    return envUrl;
  }

  // 2. Local development detection (in browser)
  if (typeof window !== "undefined") {
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "::1";

    if (isLocalhost) {
      return (
        (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_LOCAL_API_URL) ||
        "http://localhost:5000"
      );
    }
  }

  // 3. Production Vercel / Cloud fallback to live Render backend
  return "https://data-science-px6q.onrender.com";
};

const RAW_API_URL = getRawApiUrl();

// Base server origin without trailing slashes
export const API_URL = RAW_API_URL.replace(/\/+$/, "");

// API base URL for route endpoints (guarantees /api prefix)
export const API_BASE_URL = API_URL.endsWith("/api") ? API_URL : `${API_URL}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000,
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
  // Extract custom backend message or detail
  const backendMsg =
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.response?.data?.detail;

  if (backendMsg) return backendMsg;

  if (error.response?.status === 409) {
    return "This invitation or record already exists. You can resend or revoke it from the list.";
  }

  if (!error.response || error.response.status >= 500) {
    return "The server is temporarily unavailable or taking time to wake up. Please retry in a few moments.";
  }

  return error.message || fallback;
};

export default api;