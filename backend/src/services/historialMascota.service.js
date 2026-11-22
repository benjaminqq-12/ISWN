"use strict";
import { AppDataSource } from "../config/configDb.js";
import HistorialMascotaSchema from "../entity/historialMascota.entity.js";
import MascotaSchema from "../entity/mascota.entity.js";

export async function getHistorialMascotaService(mascotaId) {
  try {
    const mascotaRepository = AppDataSource.getRepository(MascotaSchema);
    const mascota = await mascotaRepository.findOneBy({ mascota_id: mascotaId });
    if (!mascota) return [null, "Mascota no encontrada"];

    const historialRepository = AppDataSource.getRepository(HistorialMascotaSchema);
    const eventos = await historialRepository.find({
      where: { historialAdopcion_mascota: { mascota_id: mascotaId } },
      relations: { historialAdopcion_registradoPorUsuario: true },
      order: { historialMascota_fecha: "DESC", historialMascota_id: "DESC" },
    });

    // del autor solo se devuelven datos públicos (nunca el password)
    const data = eventos.map(({ historialAdopcion_registradoPorUsuario: autor, ...evento }) => ({
      ...evento,
      registradoPor: autor
        ? { usuarioId: autor.usuarioId, usuarioNombre: autor.usuarioNombre, rol: autor.rol }
        : null,
    }));

    return [data, null];
  } catch (error) {
    console.error("Error al obtener el historial de la mascota:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function agregarEventoHistorialService(mascotaId, usuarioId, { tipoEvento, descripcion }) {
  try {
    const mascotaRepository = AppDataSource.getRepository(MascotaSchema);
    const mascota = await mascotaRepository.findOneBy({ mascota_id: mascotaId });
    if (!mascota) return [null, "Mascota no encontrada"];

    const historialRepository = AppDataSource.getRepository(HistorialMascotaSchema);
    const evento = historialRepository.create({
      historialMascota_tipoEvento: tipoEvento,
      historialMascota_descripcion: descripcion,
      historialMascota_fecha: new Date(),
      historialAdopcion_mascota: { mascota_id: mascotaId },
      historialAdopcion_registradoPorUsuario: { usuarioId },
    });

    const eventoGuardado = await historialRepository.save(evento);
    return [eventoGuardado, null];
  } catch (error) {
    console.error("Error al agregar el evento al historial:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function cambiarEstadoMascotaService(mascotaId, usuarioId, { nuevoEstado, detalle }) {
  try {
    const mascotaRepository = AppDataSource.getRepository(MascotaSchema);
    const mascota = await mascotaRepository.findOneBy({ mascota_id: mascotaId });
    if (!mascota) return [null, "Mascota no encontrada"];

    const estadoAnterior = mascota.mascota_estado;
    if (estadoAnterior === nuevoEstado) {
      return [null, `La mascota ya está en estado '${nuevoEstado}'.`];
    }

    const hoy = new Date();
    mascota.mascota_estado = nuevoEstado;
    mascota.updatedAt = hoy;

    // el cambio de estado y su registro en el historial se guardan juntos o no se guarda nada
    const mascotaActualizada = await AppDataSource.transaction(async (manager) => {
      const guardada = await manager.save(MascotaSchema, mascota);

      const evento = manager.create(HistorialMascotaSchema, {
        historialMascota_tipoEvento: `Cambio de estado: ${estadoAnterior} → ${nuevoEstado}`,
        historialMascota_descripcion: detalle,
        historialMascota_fecha: hoy,
        historialAdopcion_mascota: { mascota_id: mascotaId },
        historialAdopcion_registradoPorUsuario: { usuarioId },
      });
      await manager.save(HistorialMascotaSchema, evento);

      return guardada;
    });

    return [mascotaActualizada, null];
  } catch (error) {
    console.error("Error al cambiar el estado de la mascota:", error);
    return [null, "Error interno del servidor"];
  }
}