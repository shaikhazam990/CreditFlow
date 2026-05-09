import axios from "axios";
import toast from "react-hot-toast";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Global error handling
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const message = err.response?.data?.message || "Something went wrong.";

    if (status === 401) {
      localStorage.removeItem("token");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    } else if (status === 403) {
      toast.error("Access denied.");
    } else if (status === 429) {
      toast.error("Too many requests. Please slow down.");
    } else if (status >= 500) {
      toast.error("Server error. Please try again later.");
    }

    return Promise.reject(err);
  }
);

export default api;
