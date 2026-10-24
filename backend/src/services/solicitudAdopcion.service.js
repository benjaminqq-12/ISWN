"use strict";
import { AppDataSource } from "../config/configDb.js";
import SolicitudAdopcionSchema from "../entity/solicitudAdopcion.entity.js";
import MascotaSchema from "../entity/mascota.entity.js";
import UsuarioSchema from "../entity/usuario.entity.js";
import HistorialMascotaSchema from "../entity/historialMascota.entity.js";
import {
  ESTADOS_SOLICITUD,
  esTransicionValida,
  puedeAutorizar,
  getSiguientesEstados
} from "../config/estadosSolicitud.js";

export async function crearSolicitudAdopcionService(datos) {
  try {
    const { mascotaId, usuarioAdoptanteId } = datos;

    if (!mascotaId || !usuarioAdoptanteId) {
      return [null, "Debe especificar la mascota y el usuario adoptante."];
    }

    const solicitudRepository = AppDataSource.getRepository(SolicitudAdopcionSchema);
    const mascotaRepository = AppDataSource.getRepository(MascotaSchema);
    const usuarioRepository = AppDataSource.getRepository(UsuarioSchema);

    const mascota = await mascotaRepository.findOne({ where: { mascota_id: mascotaId } });
    if (!mascota) return [null, "La mascota seleccionada no existe."];
    if (mascota.mascota_estado !== "En Refugio") {
      return [null, `No se puede solicitar la adopción: la mascota está en estado '${mascota.mascota_estado}'.`];
    }

    const adoptante = await usuarioRepository.findOne({ where: { usuarioId: usuarioAdoptanteId } });
    if (!adoptante) return [null, "El usuario adoptante no existe."];

    const nuevaSolicitud = solicitudRepository.create({
      solicitudAadopcion_estado: "Pendiente",
      solicitudAadopcion_fechaSolicitud: new Date(),
      solicitudAdopcion_mascotaAdoptada: { mascota_id: mascotaId },
      solicitudAdopcion_usuarioAdoptante: { usuarioId: usuarioAdoptanteId },
    });

    const solicitudGuardada = await solicitudRepository.save(nuevaSolicitud);
    return [solicitudGuardada, null];
  } catch (error) {
    console.error("Error al crear solicitud de adopción:", error);
    return [null, "Error interno del servidor"];
  }
}

async function obtenerAutorizador(usuarioId) {
  const usuarioRepository = AppDataSource.getRepository(UsuarioSchema);
  const usuario = await usuarioRepository.findOne({ where: { usuarioId } });

  if (!usuario) return [null, "El usuario que autoriza no existe."];
  if (!usuario.activo) return [null, "El usuario que autoriza está inactivo."];
  if (!puedeAutorizar(usuario.rol)) {
    return [null, "Solo usuarios con rol Admin o Voluntario pueden autorizar el avance de una solicitud."];
  }
  return [usuario, null];
}

async function obtenerSolicitudParaAvanzar(solicitudId, nuevoEstado) {
  const solicitudRepository = AppDataSource.getRepository(SolicitudAdopcionSchema);
  const solicitud = await solicitudRepository.findOne({
    where: { solicitudAdopcion_id: solicitudId },
    relations: { solicitudAdopcion_mascotaAdoptada: true },
  });

  if (!solicitud) return [null, "La solicitud de adopción no existe."];
  if (!solicitud.solicitudAdopcion_mascotaAdoptada) {
    return [null, "La solicitud no tiene una mascota asociada."];
  }

  const estadoActual = solicitud.solicitudAadopcion_estado;
  if (!esTransicionValida(estadoActual, nuevoEstado)) {
    return [null, `Transición inválida: una solicitud en estado '${estadoActual}' no puede pasar a '${nuevoEstado}'.`];
  }
  return [solicitud, null];
}

function aplicarAvance(solicitud, nuevoEstado, detalle, fecha) {
  solicitud.solicitudAadopcion_estado = nuevoEstado;
  solicitud.updatedAt = fecha;

  switch (nuevoEstado) {
    case ESTADOS_SOLICITUD.REUNION_INICIAL:
      solicitud.solicitudAdopcion_feunionInicial = fecha;
      break;
    case ESTADOS_SOLICITUD.VISITA_ENTREVISTA:
      solicitud.solicitudAadopcion_visitaHogar = fecha;
      break;
    case ESTADOS_SOLICITUD.SEGUIMIENTO:
      // al cerrar la visita/entrevista, el detalle queda como resultado de la entrevista
      solicitud.solicitudAdopcion_resultadoEntrevista = detalle;
      break;
    case ESTADOS_SOLICITUD.CANCELADA:
      solicitud.solicitudAdopcion_motivoCancelación = detalle;
      break;
  }
}

async function guardarAvanceConHistorial(solicitud, usuario, nuevoEstado, detalle, fecha) {
  const mascota = solicitud.solicitudAdopcion_mascotaAdoptada;

  return AppDataSource.transaction(async (manager) => {
    const guardada = await manager.save(SolicitudAdopcionSchema, solicitud);

    const evento = manager.create(HistorialMascotaSchema, {
      historialMascota_tipoEvento: `Solicitud de adopción - ${nuevoEstado}`,
      historialMascota_descripcion: detalle,
      historialMascota_fecha: fecha,
      historialAdopcion_mascota: { mascota_id: mascota.mascota_id },
      historialAdopcion_solicitudAdopcion: { solicitudAdopcion_id: solicitud.solicitudAdopcion_id },
      historialAdopcion_registradoPorUsuario: { usuarioId: usuario.usuarioId },
    });
    await manager.save(HistorialMascotaSchema, evento);

    return guardada;
  });
}

export async function avanzarEstadoSolicitudService(solicitudId, { nuevoEstado, detalle, usuarioId }) {
  try {
    const [usuario, errorUsuario] = await obtenerAutorizador(usuarioId);
    if (errorUsuario) return [null, errorUsuario];

    const [solicitud, errorSolicitud] = await obtenerSolicitudParaAvanzar(solicitudId, nuevoEstado);
    if (errorSolicitud) return [null, errorSolicitud];

    const hoy = new Date();
    aplicarAvance(solicitud, nuevoEstado, detalle, hoy);

    const solicitudActualizada = await guardarAvanceConHistorial(solicitud, usuario, nuevoEstado, detalle, hoy);
    return [solicitudActualizada, null];
  } catch (error) {
    console.error("Error al avanzar el estado de la solicitud:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function getSolicitudesService() {
  try {
    const solicitudRepository = AppDataSource.getRepository(SolicitudAdopcionSchema);
    const solicitudes = await solicitudRepository.find({
      relations: {
        solicitudAdopcion_mascotaAdoptada: true,
        solicitudAdopcion_usuarioAdoptante: true,
      },
      order: { solicitudAdopcion_id: "DESC" },
    });

    const data = solicitudes.map((s) => {
      // nunca devolver el password del adoptante
      let adoptante = null;
      if (s.solicitudAdopcion_usuarioAdoptante) {
        const { usuarioPassword, ...resto } = s.solicitudAdopcion_usuarioAdoptante;
        adoptante = resto;
      }
      return {
        ...s,
        solicitudAdopcion_usuarioAdoptante: adoptante,
        // el frontend muestra solo los pasos que el backend permite
        siguientesEstados: getSiguientesEstados(s.solicitudAadopcion_estado),
      };
    });

    return [data, null];
  } catch (error) {
    console.error("Error al obtener las solicitudes:", error);
    return [null, "Error interno del servidor"];
  }
}