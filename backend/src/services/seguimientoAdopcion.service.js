"use strict";
import { AppDataSource } from "../config/configDb.js";
import SolicitudAdopcionSchema from "../entity/solicitudAdopcion.entity.js";
import SeguimientoAdopcionSchema from "../entity/seguimientoAdopcion.entity.js";
import HistorialMascotaSchema from "../entity/historialMascota.entity.js";
import { ESTADOS_SOLICITUD } from "../config/estadosSolicitud.js";

// del autor solo se devuelven datos públicos (nunca el password)
function aRespuesta(s) {
  const autor = s.seguimientoAdopcion_registradoPorUsuario;
  return {
    seguimientoAdopcion_id: s.seguimientoAdopcion_id,
    seguimientoAdopcion_plazoDias: s.seguimientoAdopcion_plazoDias,
    seguimientoAdopcion_fechaLimite: s.seguimientoAdopcion_fechaLimite,
    seguimientoAdopcion_tipo: s.seguimientoAdopcion_tipo,
    seguimientoAdopcion_resultado: s.seguimientoAdopcion_resultado,
    seguimientoAdopcion_detalle: s.seguimientoAdopcion_detalle,
    seguimientoAdopcion_fechaRegistro: s.seguimientoAdopcion_fechaRegistro,
    pendiente: !s.seguimientoAdopcion_resultado,
    registradoPor: autor
      ? { usuarioId: autor.usuarioId, usuarioNombre: autor.usuarioNombre ?? null, rol: autor.rol ?? null }
      : null,
  };
}

export async function getSeguimientosSolicitudService(solicitudId) {
  try {
    const solicitudRepository = AppDataSource.getRepository(SolicitudAdopcionSchema);
    const solicitud = await solicitudRepository.findOneBy({ solicitudAdopcion_id: solicitudId });
    if (!solicitud) return [null, "La solicitud de adopción no existe."];

    const seguimientoRepository = AppDataSource.getRepository(SeguimientoAdopcionSchema);
    const seguimientos = await seguimientoRepository.find({
      where: { seguimientoAdopcion_solicitud: { solicitudAdopcion_id: solicitudId } },
      relations: { seguimientoAdopcion_registradoPorUsuario: true },
      order: { seguimientoAdopcion_plazoDias: "ASC" },
    });

    return [seguimientos.map(aRespuesta), null];
  } catch (error) {
    console.error("Error al obtener los seguimientos:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function registrarSeguimientoService(solicitudId, seguimientoId, usuarioId, { tipo, resultado, detalle }) {
  try {
    const seguimientoRepository = AppDataSource.getRepository(SeguimientoAdopcionSchema);

    const seguimiento = await seguimientoRepository.findOne({
      where: {
        seguimientoAdopcion_id: seguimientoId,
        seguimientoAdopcion_solicitud: { solicitudAdopcion_id: solicitudId },
      },
      relations: {
        seguimientoAdopcion_solicitud: { solicitudAdopcion_mascotaAdoptada: true },
      },
    });
    if (!seguimiento) return [null, "El seguimiento no existe."];

    const solicitud = seguimiento.seguimientoAdopcion_solicitud;
    if (solicitud.solicitudAadopcion_estado !== ESTADOS_SOLICITUD.SEGUIMIENTO) {
      return [null, `Solo se pueden registrar seguimientos de solicitudes en estado '${ESTADOS_SOLICITUD.SEGUIMIENTO}'.`];
    }
    if (seguimiento.seguimientoAdopcion_resultado) {
      return [null, "Este seguimiento ya fue registrado."];
    }

    const mascota = solicitud.solicitudAdopcion_mascotaAdoptada;
    if (!mascota) return [null, "La solicitud no tiene una mascota asociada."];

    const hoy = new Date();
    seguimiento.seguimientoAdopcion_tipo = tipo;
    seguimiento.seguimientoAdopcion_resultado = resultado;
    seguimiento.seguimientoAdopcion_detalle = detalle;
    seguimiento.seguimientoAdopcion_fechaRegistro = hoy;
    seguimiento.seguimientoAdopcion_registradoPorUsuario = { usuarioId };

    // el seguimiento y su registro en el historial de la mascota se guardan juntos o no se guarda nada
    const guardado = await AppDataSource.transaction(async (manager) => {
      const resultadoGuardado = await manager.save(SeguimientoAdopcionSchema, seguimiento);

      const evento = manager.create(HistorialMascotaSchema, {
        historialMascota_tipoEvento: `Seguimiento ${seguimiento.seguimientoAdopcion_plazoDias} días (${tipo}) - ${resultado}`,
        historialMascota_descripcion: detalle,
        historialMascota_fecha: hoy,
        historialAdopcion_mascota: { mascota_id: mascota.mascota_id },
        historialAdopcion_solicitudAdopcion: { solicitudAdopcion_id: solicitud.solicitudAdopcion_id },
        historialAdopcion_registradoPorUsuario: { usuarioId },
      });
      await manager.save(HistorialMascotaSchema, evento);

      return resultadoGuardado;
    });

    return [aRespuesta(guardado), null];
  } catch (error) {
    console.error("Error al registrar el seguimiento:", error);
    return [null, "Error interno del servidor"];
  }
}