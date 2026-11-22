import axios from "./root.service.js";


export async function getHistorialMascota(mascotaId) {
  try {
    const response = await axios.get(`/mascotas/${mascotaId}/historial`);
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
      { tipoEvento, descripcion }
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
      { nuevoEstado, detalle }
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