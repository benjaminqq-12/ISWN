"use strict";
import { AppDataSource } from "../config/configDb.js";
import MascotaSchema from "../entity/mascota.entity.js";

export async function getMascotasService() {
  try {
    const mascotaRepository = AppDataSource.getRepository(MascotaSchema);
    const mascotas = await mascotaRepository.find();
    if (!mascotas || mascotas.length === 0) return [null, "No hay mascotas"];
    console.log("hay un total de %d mascotas", mascotas.length);
    const mascotasData = mascotas.map(({ id, ...item }) => item);
    return [mascotas, null];
  } catch (error) {
    console.error("Error al obtener a las mascotas:", error);
    return [null, "Error interno del servidor"];
  }
}