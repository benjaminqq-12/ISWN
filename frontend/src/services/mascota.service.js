
import axios from "./root.service.js";

// Extraer los datos de la respuesta del servidor.
async function obtenerDatos(peticion, mensajeError) {
  try {
    const respuesta = await peticion;
    return respuesta.data?.data;

  } catch (error) {
    // Mostrar el error original de Axios.
    console.error("Error real en servicio de mascotas:", {
      metodo: error.config?.method,
      url: error.config?.url,
      codigoHTTP: error.response?.status,
      mensajeBackend: error.response?.data?.message,
      detallesBackend: error.response?.data?.details,
      respuestaCompleta: error.response?.data,
      errorOriginal: error,
    });

    // Conservar el error original dentro de cause.
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      mensajeError,
      { cause: error }
    );
  }
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

// Obtener todas las mascotas con info para internos
export async function getMascotasInternas() {
  try {
    const response = await axios.get("/mascotas/interno");

    console.log(
      "Mascotas internas obtenidas:",
      response.data
    );

    return response.data.data;
  } catch (error) {
    console.error("Error en getMascotasInternas:", {
      status: error.response?.status,
      mensaje: error.response?.data?.message,
      datos: error.response?.data,
      url: error.config?.url,
    });

    throw error;
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

export async function revisarMascotasLote(ids, token) {
  return obtenerDatos(
    axios.post("/mascotas/lote/revision",
      { ids },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    ),
    "No se pudieron revisar las mascotas seleccionadas."
  );
}

export async function eliminarMascotasLote(datos, token) {
  return obtenerDatos(
    axios.delete("/mascotas/lote", {
      data: datos,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
    "No se pudieron eliminar las mascotas seleccionadas"
  );
}

