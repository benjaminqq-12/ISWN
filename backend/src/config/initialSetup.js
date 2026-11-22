"use strict";
import bcrypt from "bcryptjs";
import { AppDataSource } from "./configDb.js";
import UsuarioSchema from "../entity/usuario.entity.js";
import MascotaSchema from "../entity/mascota.entity.js";
import VeterinarioSchema from "../entity/Veterinario.entity.js";

const FOTOS_DEFAULT = {
  "Brandy": "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop&q=80",
  "Hachiko": "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&auto=format&fit=crop&q=80",
  "Misha": "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop&q=80",
  "Firulais": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&auto=format&fit=crop&q=80",
  "Luna": "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=800&auto=format&fit=crop&q=80",
  "Rocky": "https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&auto=format&fit=crop&q=80",
};

export async function createUsuarios() {
  try {
    const userRepository = AppDataSource.getRepository(UsuarioSchema);
    const count = await userRepository.count();

    const mascotaRepository = AppDataSource.getRepository(MascotaSchema);

    if (count > 0) {
      const mascotas = await mascotaRepository.find();
      for (const m of mascotas) {
        if (!m.mascota_fotoURL && FOTOS_DEFAULT[m.mascota_nombreCompleto]) {
          m.mascota_fotoURL = FOTOS_DEFAULT[m.mascota_nombreCompleto];
          await mascotaRepository.save(m);
        }
      }
      return;
    }

    await userRepository.save([
        userRepository.create({
            rut: "11111111-1",
            usuarioNombre: "Administrador",
            usuarioEmail: "admin@gmail.com",
            usuarioPassword: await bcrypt.hash("adminPassword123", 10),
            rol: "Admin"
        }),
        userRepository.create({
            rut: "22222222-2",
            usuarioNombre: "Antonia Jerez",
            usuarioEmail: "AntoniaJJ@gmail.com",
            usuarioPassword: await bcrypt.hash("password123", 10),
            rol: "Voluntario"
        }),
        userRepository.create({
            rut: "33333333-3",
            usuarioNombre: "Alejandro Herrera",
            usuarioEmail: "Alejandro@gmail.com",
            usuarioPassword: await bcrypt.hash("password123", 10),
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
            mascota_antecedentesPrevios: "Sin antecedentes",
            mascota_fotoURL: FOTOS_DEFAULT["Brandy"]
        }),
        mascotaRepository.create({
            mascota_nombreCompleto: "Hachiko",
            mascota_especie: "Perro",
            mascota_edad: 1,
            mascota_peso: 8.2,
            mascota_sexo: "Macho",
            mascota_viaIngreso: "Abandono",
            mascota_estado: "En Refugio",
            mascota_fotoURL: FOTOS_DEFAULT["Hachiko"],
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
            mascota_antecedentesPrevios: "Sin antecedentes",
            mascota_fotoURL: FOTOS_DEFAULT["Misha"]
        }),
        mascotaRepository.create({
            mascota_nombreCompleto: "Firulais",
            mascota_especie: "Perro",
            mascota_edad: 5,
            mascota_peso: 22.0,
            mascota_sexo: "Macho",
            mascota_viaIngreso: "Denuncia municipal",
            mascota_estado: "En Refugio",
            mascota_antecedentesPrevios: "Cartilla de vacunas al día",
            mascota_fotoURL: FOTOS_DEFAULT["Firulais"]
        }),
        mascotaRepository.create({
            mascota_nombreCompleto: "Luna",
            mascota_especie: "Gato",
            mascota_edad: 1,
            mascota_peso: 3.4,
            mascota_sexo: "Hembra",
            mascota_viaIngreso: "Entrega voluntaria",
            mascota_estado: "En Refugio",
            mascota_antecedentesPrevios: "Sin antecedentes",
            mascota_fotoURL: FOTOS_DEFAULT["Luna"]
        }),
        mascotaRepository.create({
            mascota_nombreCompleto: "Rocky",
            mascota_especie: "Perro",
            mascota_edad: 4,
            mascota_peso: 18.7,
            mascota_sexo: "Macho",
            mascota_viaIngreso: "Otro refugio",
            mascota_estado: "En Cuarentena",
            mascota_antecedentesPrevios: "En evaluación veterinaria",
            mascota_fotoURL: FOTOS_DEFAULT["Rocky"]
          }),
    ]);
    console.log("* => Mascotas iniciales creadas exitosamente");
  } catch (error) {
    console.error("Error al crear mascotas:", error);
  }
}
export async function createVeterinarioPrueba() {
    try {
        const correo = "veterinario.prueba@iswn.cl";
        const password = "VetPrueba2026!";

        await AppDataSource.transaction(async (manager) => {
            const usuarioRepository = manager.getRepository(UsuarioSchema);
            const veterinarioRepository = manager.getRepository(VeterinarioSchema);

            // Buscar si el usuario ya existe
            let usuario = await usuarioRepository.findOne({
                where: { usuarioEmail: correo }
            });

            // Si existe, comprobar que tenga el rol correcto
            if (usuario && usuario.rol !== "Veterinario") {
                throw new Error(
                    "El correo de prueba ya pertenece a un usuario con otro rol"
                );
            }

            // Crear el usuario si todavía no existe
            // Crear o actualizar el usuario veterinario
if (!usuario) {
    const passwordHash = await bcrypt.hash(password, 10);

    usuario = usuarioRepository.create({
        rut: "99.999.999-9",
        usuarioNombre: "Dr. Sebastián Valdés Riquelme",
        usuarioEmail: correo,
        usuarioPassword: passwordHash,
        rol: "Veterinario",
        activo: true
    });

    usuario = await usuarioRepository.save(usuario);
} else {
    usuario.usuarioNombre = "Dr. Sebastián Valdés Riquelme";
    await usuarioRepository.save(usuario);
}
            // Comprobar si ya tiene un registro veterinario
            const veterinarioExistente = await veterinarioRepository.findOne({
                where: {
                    usuario: {
                        usuarioId: usuario.usuarioId
                    }
                }
            });

            // Crear la asociación si todavía no existe
            if (!veterinarioExistente) {
                const veterinario = veterinarioRepository.create({
                    veterinario_especialidad: "Medicina veterinaria",
                    veterinario_registroProfesional: null,
                    usuario: usuario
                });

                await veterinarioRepository.save(veterinario);
            }
        });

        console.log("=> Veterinario de prueba creado o ya existente");
        console.log("=> Correo: veterinario.prueba@iswn.cl");
        console.log("=> Contraseña: VetPrueba2026!");

    } catch (error) {
        console.error("Error al crear veterinario de prueba:", error);
    }
}