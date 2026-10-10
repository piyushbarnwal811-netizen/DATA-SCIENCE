import axios from "axios";

const api = axios.create({ baseURL: "/api", timeout: 15000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ccr_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem("ccr_token")) {
      localStorage.removeItem("ccr_token");
      localStorage.removeItem("ccr_user");
      window.dispatchEvent(new Event("ccr:unauthorized"));
    }
    return Promise.reject(error);
  }
);

export const errorMessage = (error, fallback = "Something went wrong. Please try again.") => {
  if (error.response?.data?.message) return error.response.data.message;
  if (!error.response || error.response.status >= 500) {
    return "The API is unavailable. Start the backend and MongoDB, then try again.";
  }
  return error.message || fallback;
};

export default api;