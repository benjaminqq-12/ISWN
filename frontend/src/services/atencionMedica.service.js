
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

    // Consultar historial y calendario de cada mascota.
    const resultados = await Promise.allSettled(
      mascotas.map(async (mascota) => {
        const mascotaId = mascota.mascota_id;

        const [historial, calendario] = await Promise.all([
          obtenerHistorialClinico(mascotaId),
          obtenerCalendarioSanitario(mascotaId),
        ]);

        return {
          mascota,
          mascotaId,
          historial,
          calendario,
        };
      })
    );

    const historiales = [];
    const eventosCalendario = [];

    resultados.forEach((resultado) => {
      if (resultado.status !== "fulfilled") {
        console.error(
          "No se pudieron cargar datos de una mascota:",
          resultado.reason
        );

        return;
      }

      const datos = resultado.value;

      // Agregar la mascota a cada registro del historial.
      historiales.push(
        ...datos.historial.map((registro) => ({
          ...registro,
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

    // Ordenar historial: más reciente primero.
    historiales.sort((a, b) => {
      const fechaA = new Date(
        a.historialClinico_atencionMedica?.atencion_fecha || 0
      );

      const fechaB = new Date(
        b.historialClinico_atencionMedica?.atencion_fecha || 0
      );

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
