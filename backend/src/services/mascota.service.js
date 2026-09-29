"use strict";
import { AppDataSource } from "../config/configDb.js";
import MascotaSchema from "../entity/mascota.entity.js";

export async function getMascotasService() {
  try {
    const mascotaRepository = AppDataSource.getRepository(MascotaSchema);
    const mascotas = await mascotaRepository.find();
    console.log("hay un total de %d mascotas", mascotas.length);
    const mascotasData = mascotas.map(({ id, ...item }) => item);
    return [mascotas, null];
  } catch (error) {
    console.error("Error al obtener a las mascotas:", error);
    return [null, "Error interno del servidor"];
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