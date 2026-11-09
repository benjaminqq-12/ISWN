import axios from "./root.service.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export async function getUsuarios() {
  const response = await fetch(`${API_URL}/usuarios`);
  if (!response.ok) throw new Error("Error al obtener los usuarios");
  const { data } = await response.json();
  return data;
}

export async function iniciarSesion(usuarioEmail, usuarioPassword) {
  try {
    const response = await axios.post("/auth/login", { usuarioEmail, usuarioPassword });
    const sesion = response.data?.data;
    if (!sesion?.token || !sesion?.user) {
      throw new Error(response.data?.message || "El servidor devolvió una sesión inválida.");
    }
    return sesion;
  } catch (error) {
    throw new Error(
      error.response?.data?.message
        || error.message
        || "Error de conexión con el servidor.",
      { cause: error }
    );
  }
}