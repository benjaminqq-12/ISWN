"use strict";
import { AppDataSource } from "../config/configDb.js";
import SolicitudAdopcionSchema from "../entity/solicitudAdopcion.entity.js";
import MascotaSchema from "../entity/mascota.entity.js";
import UsuarioSchema from "../entity/usuario.entity.js";

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