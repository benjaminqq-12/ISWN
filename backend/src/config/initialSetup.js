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
            nombre: "Administrador", 
            email: "admin@gmail.com" 
        }),
        userRepository.create({ 
            nombre: "Usuario1", 
            email: "user@gmail.com" 
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
            nombre: "Brandy", 
            chip: true 
        }),
        animalRepository.create({ 
            nombre: "Hachiko", 
            chip: false 
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
            nombre: "Antonia Jerez", 
            email: "AntoniaJJ@gmail.com" 
        }),
        voluntarioRepository.create({ 
            nombre: "Alejandro Herrera", 
            email: "Alejandro@gmail.com" 
        }),
    ]);
    console.log("* => Voluntarios iniciales creados exitosamente");
  } catch (error) {
    console.error("Error al crear voluntarios:", error);
  }
}