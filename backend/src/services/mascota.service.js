"use strict";
import { AppDataSource } from "../config/configDb.js";
import MascotaSchema from "../entity/mascota.entity.js";

export async function getMascotasService() {
  try {
    const mascotaRepository = AppDataSource.getRepository(MascotaSchema);
    const mascotas = await mascotaRepository.find();
    console.log("hay un total de %d mascotas", mascotas.length);
    const mascotasPublicas = mascotas.map((mascota) => ({
      mascota_id: mascota.mascota_id,
      mascota_nombreCompleto: mascota.mascota_nombreCompleto,
      mascota_especie: mascota.mascota_especie,
      mascota_edad: mascota.mascota_edad,
      mascota_peso: mascota.mascota_peso,
      mascota_sexo: mascota.mascota_sexo,
      mascota_estado: mascota.mascota_estado,
      mascota_fotoURL: mascota.mascota_fotoURL,
    }));
    return [mascotasPublicas, null];
  } catch (error) {
    console.error("Error al obtener a las mascotas:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function getMascotaService(id) {
  try {
    const mascotaRepository = AppDataSource.getRepository(MascotaSchema);
    const mascota = await mascotaRepository.findOneBy({ mascota_id: id });
    if (!mascota) return [null, "Mascota no encontrada"];
    return [mascota, null];
  } catch (error) {
    console.error("Error al obtener la mascota:", error);
    return [null, "Error interno al obtener la mascota"];
  }
}

export async function crearMascotaService(datosMascota) {
  try {
    const mascotaRepository = AppDataSource.getRepository(MascotaSchema);
    const mascota = mascotaRepository.create(datosMascota);
    const mascotaGuardada = await mascotaRepository.save(mascota);
    return [mascotaGuardada, null];
  } catch (error) {
    console.error("Error al registrar a la mascota:", error);
    return [null, "Error interno al registrar la mascota"];
  }
}

export async function actualizarMascotaService(id, datosActualizados) {
  try {
    const mascotaRepository = AppDataSource.getRepository(MascotaSchema);
    const mascotaExistente = await mascotaRepository.findOneBy({ mascota_id: id });

    if (!mascotaExistente) {
      return [null, "Mascota no encontrada"];
    }

    const mascotaActualizada = Object.assign(mascotaExistente, datosActualizados);
    const mascotaGuardada = await mascotaRepository.save(mascotaActualizada);
    return [mascotaGuardada, null];
  } catch (error) {
    console.error("Error al actualizar a la mascota:", error);
    return [null, "Error interno al actualizar la mascota"];
  }
}

export async function eliminarMascotaService(id) {
  try {
    const mascotaRepository = AppDataSource.getRepository(MascotaSchema);
    const mascotaExistente = await mascotaRepository.findOneBy({ mascota_id: id });

    if (!mascotaExistente) {
      return [null, "Mascota no encontrada"];
    }

    await mascotaRepository.remove(mascotaExistente);
    return [mascotaExistente, null];
  } catch (error) {
    console.error("Error al eliminar a la mascota:", error);
    if (error?.driverError?.code === "23503") {
      return [null, "No se puede eliminar la mascota porque tiene registros relacionados"];
    }
    return [null, "Error interno al eliminar la mascota"];
  }
}