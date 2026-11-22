import axios from "./root.service.js";
import cookies from "js-cookie";

export async function getUsuarios() {
  try {
    const response = await axios.get("/usuarios");
    return response.data.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        "Error al obtener los usuarios",
function authConfig() {
  const token = cookies.get("jwt-auth");
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
}

export async function getUsuarios() {
  try {
    const response = await axios.get("/usuarios", authConfig());
    return response.data?.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message
        || error.message
        || "Error de conexión con el servidor.",
      { cause: error }
    );
  }
}

export async function crearUsuario({ rut, usuarioNombre, usuarioEmail, usuarioPassword, rol }) {
  try {
    const response = await axios.post(
      "/usuarios",
      { rut, usuarioNombre, usuarioEmail, usuarioPassword, rol },
      authConfig()
    );
    return response.data?.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message
        || error.message
        || "Error de conexión con el servidor.",
      { cause: error }
    );
  }
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

export async function registrarUsuario({ rut, usuarioNombre, usuarioEmail, usuarioPassword }) {
  try {
    const response = await axios.post("/auth/register", {
      rut,
      usuarioNombre,
      usuarioEmail,
      usuarioPassword,
    });
    return response.data?.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message
        || error.message
        || "Error de conexión con el servidor.",
      { cause: error }
    );
  }
}