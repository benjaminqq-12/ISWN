
import instance from "./root.service";

/**
 * Registra una nueva atención médica.
 */
export const registrarAtencionMedica = async (datosAtencion) => {
  try {
    const respuesta = await instance.post(
      "/atenciones-medicas",
      datosAtencion
    );

    return respuesta.data;
  } catch (error) {
    console.error(
      "Error al registrar la atención médica:",
      error.response?.data || error.message
    );

    throw error;
  }
};
/**
 * Registra una vacuna independiente para una mascota.
 */
export const registrarVacuna = async (datosVacuna) => {
  try {
    const respuesta = await instance.post(
      "/vacunas",
      datosVacuna
    );

    return respuesta.data;
  } catch (error) {
    console.error(
      "Error al registrar la vacuna:",
      error.response?.data || error.message
    );

    throw error;
  }
};

/**
 * Actualiza una atención médica existente.
 */
export const actualizarAtencionMedica = async (
  atencionId,
  datosAtencion
) => {
  try {
    const respuesta = await instance.put(
      `/atenciones-medicas/${atencionId}`,
      datosAtencion
    );

    return respuesta.data;
  } catch (error) {
    console.error(
      "Error al actualizar la atención médica:",
      error.response?.data || error.message
    );

    throw error;
  }
};

/**
 * Elimina una atención médica y sus registros relacionados.
 */
export const eliminarAtencionMedica = async (atencionId) => {
  try {
    const respuesta = await instance.delete(
      `/atenciones-medicas/${atencionId}`
    );

    return respuesta.data;
  } catch (error) {
    console.error(
      "Error al eliminar la atención médica:",
      error.response?.data || error.message
    );

    throw error;
  }
};

/**
 * Obtiene el historial clínico de una mascota.
 */
export const obtenerHistorialClinico = async (mascotaId) => {
  try {
    const respuesta = await instance.get(
      `/historial-clinico/${mascotaId}`
    );

    return respuesta.data.data || [];
  } catch (error) {
    console.error(
      "Error al obtener el historial clínico:",
      error.response?.data || error.message
    );

    throw error;
  }
};

/**
 * Obtiene las vacunas registradas de una mascota.
 */
export const obtenerVacunasMascota = async (mascotaId) => {
  try {
    const respuesta = await instance.get(
      `/vacunas/mascota/${mascotaId}`
    );

    return respuesta.data.data || [];
  } catch (error) {
    console.error(
      "Error al obtener las vacunas de la mascota:",
      error.response?.data || error.message
    );

    throw error;
  }
};

/**
 * Obtiene el calendario sanitario de una mascota.
 */
export const obtenerCalendarioSanitario = async (mascotaId) => {
  try {
    const respuesta = await instance.get(
      `/calendario-sanidad/${mascotaId}`
    );

    return respuesta.data.data || [];
  } catch (error) {
    console.error(
      "Error al obtener el calendario sanitario:",
      error.response?.data || error.message
    );

    throw error;
  }
};

/**
 * Carga los datos del panel de Atención Médica.
 */
export const obtenerDatosPanelAtencionMedica = async () => {
  try {
    // Obtener las mascotas registradas.
    const respuestaMascotas = await instance.get("/mascotas");
    const mascotas = respuestaMascotas.data.data || [];

    // Consultar historial, vacunas y calendario de cada mascota.
    const resultados = await Promise.allSettled(
      mascotas.map(async (mascota) => {
        const mascotaId = mascota.mascota_id;

        const [historial, vacunas, calendario] = await Promise.all([
          obtenerHistorialClinico(mascotaId),
          obtenerVacunasMascota(mascotaId),
          obtenerCalendarioSanitario(mascotaId),
        ]);

        return {
          mascota,
          mascotaId,
          historial,
          vacunas,
          calendario,
        };
      })
    );

    const historiales = [];
    const eventosCalendario = [];

    resultados.forEach((resultado) => {
      if (resultado.status !== "fulfilled") {
        console.error(
          "No se pudieron cargar los datos de una mascota:",
          resultado.reason
        );

        return;
      }

      const datos = resultado.value;

      // Agregar las atenciones médicas al historial.
      historiales.push(
        ...datos.historial.map((registro) => ({
          ...registro,
          tipoRegistro: "ATENCION",
          fechaRegistro:
            registro.historialClinico_atencionMedica?.atencion_fecha,
          mascota: datos.mascota,
        }))
      );

      // Agregar las vacunas independientes al historial.
      historiales.push(
        ...datos.vacunas.map((vacuna) => ({
          tipoRegistro: "VACUNACION",
          fechaRegistro: vacuna.vacuna_fechaAplicacion,
          vacuna,
          mascota: datos.mascota,
        }))
      );

      // Agregar información de la mascota a cada evento.
      eventosCalendario.push(
        ...datos.calendario.map((evento) => ({
          ...evento,
          mascota_id: datos.mascotaId,
          mascota: datos.mascota,
        }))
      );
    });

    // Ordenar historial: registros más recientes primero.
    historiales.sort((a, b) => {
      const fechaA = new Date(a.fechaRegistro || 0);
      const fechaB = new Date(b.fechaRegistro || 0);

      return fechaB - fechaA;
    });

    // Ordenar calendario por fecha programada.
    eventosCalendario.sort((a, b) => {
      return (
        new Date(a.calendarioSanidad_fecha) -
        new Date(b.calendarioSanidad_fecha)
      );
    });

    // Obtener eventos pendientes.
    const tratamientosPendientes = eventosCalendario.filter(
      (evento) =>
        evento.calendarioSanidad_estado === "PENDIENTE"
    );

    return {
      mascotas,
      historial: historiales,
      eventosCalendario,
      tratamientosPendientes,
    };
  } catch (error) {
    console.error(
      "Error al cargar el panel de atención médica:",
      error.response?.data || error.message
    );

    throw error;
  }
};
