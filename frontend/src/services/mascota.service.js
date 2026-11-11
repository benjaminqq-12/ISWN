
import axios from "./root.service.js";

// Extraer los datos de la respuesta del servidor.
function obtenerDatos(response, mensajeError) {
  if (response.data?.status !== "Success") {
    throw new Error(response.data?.message || mensajeError);
  }

  return response.data.data;
}

// Obtener todas las mascotas.
export async function getMascotas() {
  try {
    const response = await axios.get("/mascotas");

    return obtenerDatos(
      response,
      "Error al obtener las mascotas"
    );
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      "No se pudieron obtener las mascotas."
    );
  }
}

// Obtener una mascota por su ID.
export async function getMascota(id) {
  try {
    const response = await axios.get(`/mascotas/${id}`);

    return obtenerDatos(
      response,
      "No se pudo obtener la mascota"
    );
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      "No se pudo obtener la mascota."
    );
  }
}

// Obtener los datos internos de una mascota.
export async function getMascotaInterna(id, token) {
  try {
    const response = await axios.get(
      `/mascotas/${id}/interno`,
      token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {}
    );

    return obtenerDatos(
      response,
      "No se pudieron obtener los datos internos"
    );
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      "No se pudieron obtener los datos internos."
    );
  }
}

// Iniciar sesión.
export async function iniciarSesion(usuarioEmail, usuarioPassword) {
  try {
    const response = await axios.post("/auth/login", {
      usuarioEmail,
      usuarioPassword
    });

    const sesion = response.data?.data;

    if (!sesion?.token || !sesion?.user) {
      throw new Error(
        response.data?.message ||
        "El servidor devolvió una sesión inválida."
      );
    }

    return sesion;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      "Error de conexión con el servidor."
    );
  }
}

/**
 * Obtiene los datos actuales del usuario autenticado.
 * Verifica la vigencia del JWT mediante el backend.
 *
 * @param {string} token - Token JWT del usuario.
 * @returns {Promise<Object>} Usuario autenticado.
 */
export async function obtenerUsuarioActual(token) {
  const response = await axios.get("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data.data;
}

export async function crearMascota(mascota, token) {
  try {
    const response = await axios.post(
      "/mascotas",
      mascota,
      token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {}
    );

    return obtenerDatos(
      response,
      "No se pudo registrar la mascota"
    );
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      "No se pudo registrar la mascota."
    );
  }
}

// Actualizar una mascota.
export async function actualizarMascota(id, mascota, token) {
  try {
    const response = await axios.put(
      `/mascotas/${id}`,
      mascota,
      token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {}
    );

    return obtenerDatos(
      response,
      "No se pudo actualizar la mascota"
    );
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      "No se pudo actualizar la mascota."
    );
  }
}

// Eliminar una mascota.
export async function eliminarMascota(id, token) {
  try {
    const response = await axios.delete(
      `/mascotas/${id}`,
      token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {}
    );

    return obtenerDatos(
      response,
      "No se pudo eliminar la mascota"
    );
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      "No se pudo eliminar la mascota."
    );
  }
}
