import axios from "axios";

// Render deployed backend URL (can be overridden by VITE_API_URL if running against a local server)
export const BACKEND_URL =
  import.meta.env.VITE_API_URL || "https://reviseiq.onrender.com";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD ? "https://reviseiq.onrender.com" : ""),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach stored JWT token if available in localStorage
if (typeof window !== "undefined") {
  const token = localStorage.getItem("reviseiq_token");
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }
}

export default api;
