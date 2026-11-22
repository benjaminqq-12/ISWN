
import axios from "axios";
import cookies from "js-cookie";

const API_URL = "http://localhost:3000/api/solicitudes-voluntarios";

export async function obtenerSolicitudesPendientes() {
  const token = cookies.get("jwt-auth");

  if (!token) {
    throw new Error("Debes iniciar sesión como administrador.");
  }

  try {
    const respuesta = await axios.get(
      `${API_URL}/pendientes`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return respuesta.data.data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error("Tu sesión no es válida. Inicia sesión nuevamente.");
    }

    if (error.response?.status === 403) {
      throw new Error("No tienes permisos para consultar estas solicitudes.");
    }

    throw new Error(
      error.response?.data?.message ||
      "No se pudieron cargar las solicitudes."
    );
  }
}

export async function cambiarEstadoSolicitud(id, accion) {
  const token = cookies.get("jwt-auth");

  if (!token) {
    throw new Error("Debes iniciar sesión como administrador.");
  }

  if (!["aprobar", "rechazar"].includes(accion)) {
    throw new Error("Acción no permitida.");
  }

  try {
    const respuesta = await axios.patch(
      `${API_URL}/${id}/${accion}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return respuesta.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
      "No se pudo procesar la solicitud."
    );
  }
}
