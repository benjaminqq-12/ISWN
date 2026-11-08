
import axios from "axios";

const API_URL = import.meta.env.VITE_BASE_URL || "http://localhost:3000/api";

const instance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

instance.interceptors.request.use(
  (config) => {
    const sesionGuardada = localStorage.getItem("sesion");

    if (sesionGuardada) {
      const sesion = JSON.parse(sesionGuardada);
      
      if (sesion.token) {
        config.headers.Authorization = `Bearer ${sesion.token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;
