"use strict";
import { AppDataSource } from "./configDb.js";
import UsuarioSchema from "../entity/usuario.entity.js";
import MascotaSchema from "../entity/mascota.entity.js";

export async function createUsuarios() {
  try {
    const userRepository = AppDataSource.getRepository(UsuarioSchema);
    const count = await userRepository.count();

    if (count > 0) return;

    await userRepository.save([
        userRepository.create({
            rut: "11111111-1",
            usuarioNombre: "Administrador",
            usuarioEmail: "admin@gmail.com",
            usuarioPassword: "adminPassword123",
            rol: "Admin"
        }),
        userRepository.create({
            rut: "22222222-2",
            usuarioNombre: "Antonia Jerez",
            usuarioEmail: "AntoniaJJ@gmail.com",
            usuarioPassword: "password123",
            rol: "Voluntario"
        }),
        userRepository.create({
            rut: "33333333-3",
            usuarioNombre: "Alejandro Herrera",
            usuarioEmail: "Alejandro@gmail.com",
            usuarioPassword: "password123",
            rol: "Voluntario"
        }),
    ]);
    console.log("* => Usuarios iniciales creados exitosamente");
  } catch (error) {
    console.error("Error al crear usuarios:", error);
  }
}

export async function createAnimales() {
  try {
    const mascotaRepository = AppDataSource.getRepository(MascotaSchema);
    const count = await mascotaRepository.count();

    if (count > 0) return;

    await mascotaRepository.save([
        mascotaRepository.create({
            mascota_nombreCompleto: "Brandy",
            mascota_especie: "Perro",
            mascota_edad: 3,
            mascota_peso: 15.5,
            mascota_sexo: "Macho",
            mascota_viaIngreso: "Rescate",
            mascota_estado: "En Refugio",
            mascota_antecedentesPrevios: "Sin antecedentes"
        }),
        mascotaRepository.create({
            mascota_nombreCompleto: "Hachiko",
            mascota_especie: "Perro",
            mascota_edad: 1,
            mascota_peso: 8.2,
            mascota_sexo: "Macho",
            mascota_viaIngreso: "Abandono",
            mascota_estado: "En Refugio",
            mascota_antecedentesPrevios: "Desnutrición leve al ingreso"
        }),
        mascotaRepository.create({
            mascota_nombreCompleto: "Misha",
            mascota_especie: "Gato",
            mascota_edad: 2,
            mascota_peso: 4.1,
            mascota_sexo: "Hembra",
            mascota_viaIngreso: "Hallazgo en vía pública",
            mascota_estado: "En Refugio",
            mascota_antecedentesPrevios: "Sin antecedentes"
        }),
        mascotaRepository.create({
            mascota_nombreCompleto: "Firulais",
            mascota_especie: "Perro",
            mascota_edad: 5,
            mascota_peso: 22.0,
            mascota_sexo: "Macho",
            mascota_viaIngreso: "Denuncia municipal",
            mascota_estado: "En Refugio",
            mascota_antecedentesPrevios: "Cartilla de vacunas al día"
        }),
        mascotaRepository.create({
            mascota_nombreCompleto: "Luna",
            mascota_especie: "Gato",
            mascota_edad: 1,
            mascota_peso: 3.4,
            mascota_sexo: "Hembra",
            mascota_viaIngreso: "Entrega voluntaria",
            mascota_estado: "En Refugio",
            mascota_antecedentesPrevios: "Sin antecedentes"
        }),
        mascotaRepository.create({
            mascota_nombreCompleto: "Rocky",
            mascota_especie: "Perro",
            mascota_edad: 4,
            mascota_peso: 18.7,
            mascota_sexo: "Macho",
            mascota_viaIngreso: "Otro refugio",
            mascota_estado: "En Cuarentena",
            mascota_antecedentesPrevios: "En evaluación veterinaria"
        }),
    ]);
    console.log("* => Mascotas iniciales creadas exitosamente");
  } catch (error) {
    console.error("Error al crear mascotas:", error);
  }
}