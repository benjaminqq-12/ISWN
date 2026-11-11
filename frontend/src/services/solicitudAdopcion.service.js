import axios from "./root.service.js";

function authConfig() {
  try {
    const token = JSON.parse(localStorage.getItem("sesion") || "null")?.token;
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  } catch {
    return {};
  }
}

export async function getSolicitudes() {
  try {
    const response = await axios.get("/solicitudes-adopcion", authConfig());
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

export async function crearSolicitudAdopcion({ mascotaId }) {
  try {
    const response = await axios.post("/solicitudes-adopcion", { mascotaId }, authConfig());
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

export async function avanzarEstadoSolicitud(id, { nuevoEstado, detalle, tipoCierre }) {
  try {
    const response = await axios.patch(
      `/solicitudes-adopcion/${id}/estado`,
      {
        nuevoEstado,
        detalle,
        // el backend rechaza tipoCierre en cualquier paso que no sea cancelar
        ...(tipoCierre ? { tipoCierre } : {}),
      },
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

export async function getSeguimientos(solicitudId) {
  try {
    const response = await axios.get(`/solicitudes-adopcion/${solicitudId}/seguimientos`, authConfig());
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

export async function registrarSeguimiento(solicitudId, seguimientoId, { tipo, resultado, detalle }) {
  try {
    const response = await axios.patch(
      `/solicitudes-adopcion/${solicitudId}/seguimientos/${seguimientoId}`,
      { tipo, resultado, detalle },
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

export async function getMisSolicitudes() {
  try {
    const response = await axios.get("/solicitudes-adopcion/mias", authConfig());
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