import axios from "./root.service.js";

function authConfig() {
  try {
    const token = JSON.parse(localStorage.getItem("sesion") || "null")?.token;
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  } catch {
    return {};
  }
}

export async function getHistorialMascota(mascotaId) {
  try {
    const response = await axios.get(`/mascotas/${mascotaId}/historial`, authConfig());
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

export async function agregarEventoHistorial(mascotaId, { tipoEvento, descripcion }) {
  try {
    const response = await axios.post(
      `/mascotas/${mascotaId}/historial`,
      { tipoEvento, descripcion },
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

export async function cambiarEstadoMascota(mascotaId, { nuevoEstado, detalle }) {
  try {
    const response = await axios.patch(
      `/mascotas/${mascotaId}/estado`,
      { nuevoEstado, detalle },
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