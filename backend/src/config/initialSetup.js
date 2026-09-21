"use strict";
import { AppDataSource } from "./configDb.js";
import UsuarioSchema from "../entity/usuario.entity.js";
import animalSchema from "../entity/animal.entity.js";
import VoluntarioSchema from "../entity/voluntario.entity.js";

export async function createUsuarios() {
  try {
    const userRepository = AppDataSource.getRepository(UsuarioSchema);
    const count = await userRepository.count();
    
    if (count > 0) return;

    await userRepository.save([
        userRepository.create({ 
            rutUsuario: "11111111-1",
            usuarioNombre: "Administrador", 
            usuarioEmail: "admin@gmail.com",
            usuarioPassword: "adminPassword123"
        }),
        userRepository.create({ 
            rutUsuario: "22222222-2",
            usuarioNombre: "Usuario1", 
            usuarioEmail: "user@gmail.com",
            usuarioPassword: "userPassword123"
        }),
    ]);
    console.log("* => Usuarios iniciales creados exitosamente");
  } catch (error) {
    console.error("Error al crear usuarios:", error);
  }
}

export async function createAnimales() {
  try {
    const animalRepository = AppDataSource.getRepository(animalSchema);
    const count = await animalRepository.count();
    
    if (count > 0) return;

    await animalRepository.save([
        animalRepository.create({ 
            animalNombre: "Brandy", 
            chip: true,
            numeroChip: "982000000123456",
            peso: 15.5,
            especie: "Perro",
            raza: "Mestizo",
            animalEdad: "3 años",
            estado: "En Refugio",
            viaIngreso: "Rescate",
            estadoGeneralIngreso: "Saludable",
            fechaIngreso: "2024-01-15"
        }),
        animalRepository.create({ 
            animalNombre: "Hachiko", 
            chip: false,
            peso: 8.2,
            especie: "Perro",
            raza: "Akita",
            animalEdad: "1 año",
            estado: "En Refugio",
            viaIngreso: "Abandono",
            estadoGeneralIngreso: "Desnutrición leve",
            fechaIngreso: "2024-02-10"
        }),
    ]);
    console.log("* => Animales iniciales creados exitosamente");
  } catch (error) {
    console.error("Error al crear animales:", error);
  }
}

export async function createVoluntarios() {
  try {
    const voluntarioRepository = AppDataSource.getRepository(VoluntarioSchema);
    const count = await voluntarioRepository.count();
    
    if (count > 0) return;

    await voluntarioRepository.save([
        voluntarioRepository.create({ 
            rutVoluntario: "33333333-3",
            voluntarioNombre: "Antonia Jerez", 
            voluntarioEmail: "AntoniaJJ@gmail.com",
            voluntarioPassword: "password123",
            rol: "Voluntario"
        }),
        voluntarioRepository.create({ 
            rutVoluntario: "44444444-4",
            voluntarioNombre: "Alejandro Herrera", 
            voluntarioEmail: "Alejandro@gmail.com",
            voluntarioPassword: "password123",
            rol: "Voluntario"
        }),
    ]);
    console.log("* => Voluntarios iniciales creados exitosamente");
  } catch (error) {
    console.error("Error al crear voluntarios:", error);
  }
}