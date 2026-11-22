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

export async function crearSolicitudAdopcion({ mascotaId, telefono, correo, direccion, mascotasActuales, motivoAdopcion }) {
  try {
    const response = await axios.post(
      "/solicitudes-adopcion",
      { mascotaId, telefono, correo, direccion, mascotasActuales, motivoAdopcion },
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

export async function puedeSolicitarAdopcion() {
  try {
    const response = await axios.get("/solicitudes-adopcion/puede-solicitar", authConfig());
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

export async function descargarComprobante(solicitudId) {
  try {
    const response = await axios.get(`/solicitudes-adopcion/${solicitudId}/comprobante`, {
      ...authConfig(),
      responseType: "blob",
    });

    // un enlace común no puede enviar el token, así que el archivo se baja por axios y se guarda desde aquí
    const url = window.URL.createObjectURL(response.data);
    const enlace = document.createElement("a");
    enlace.href = url;
    enlace.download = `comprobante-adopcion-${solicitudId}.pdf`;
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    // con responseType "blob", el cuerpo del error también llega como Blob: hay que leerlo para sacar el mensaje
    let mensaje = null;
    const cuerpo = error.response?.data;
    if (cuerpo instanceof Blob) {
      try {
        mensaje = JSON.parse(await cuerpo.text()).message;
      } catch {
        mensaje = null;
      }
    }
    throw new Error(
      mensaje
        || error.message
        || "Error de conexión con el servidor.",
      { cause: error }
    );
  }
}