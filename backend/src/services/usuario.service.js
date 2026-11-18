"use strict";
import bcrypt from "bcryptjs";
import { AppDataSource } from "../config/configDb.js";
import UsuarioSchema from "../entity/usuario.entity.js";

export async function getUsuariosService() {
  try {
    const usuarioRepository = AppDataSource.getRepository(UsuarioSchema);
    const usuarios = await usuarioRepository.find();
    if (!usuarios || usuarios.length === 0) return [null, "No hay usuarios"];

    // nunca devolver el password al frontend
    const usuariosData = usuarios.map(({ usuarioPassword, ...item }) => item);
    return [usuariosData, null];
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return [null, "Error interno del servidor"];
  }
}

export async function crearUsuarioService({ rut, usuarioNombre, usuarioEmail, usuarioPassword, rol }) {
  try {
    const usuarioRepository = AppDataSource.getRepository(UsuarioSchema);

    const rutExistente = await usuarioRepository.findOneBy({ rut });
    if (rutExistente) return [null, "Ya existe una cuenta registrada con ese RUT."];

    // el correo se compara sin distinguir mayúsculas, para no crear cuentas duplicadas
    const correoExistente = await usuarioRepository
      .createQueryBuilder("u")
      .where("LOWER(u.usuarioEmail) = LOWER(:correo)", { correo: usuarioEmail })
      .getOne();
    if (correoExistente) return [null, "Ya existe una cuenta registrada con ese correo."];

    const passwordHash = await bcrypt.hash(usuarioPassword, 10);

    const nuevoUsuario = usuarioRepository.create({
      rut,
      usuarioNombre,
      usuarioEmail,
      usuarioPassword: passwordHash,
      rol,
      activo: true,
    });
    const guardado = await usuarioRepository.save(nuevoUsuario);

    // nunca devolver el password
    const { usuarioPassword: _omitido, ...publico } = guardado;
    return [publico, null];
  } catch (error) {
    console.error("Error al crear el usuario:", error);
    // dos registros simultáneos con el mismo RUT o correo
    if (error?.driverError?.code === "23505") {
      return [null, "Ya existe una cuenta registrada con ese RUT o correo."];
    }
    return [null, "Error interno del servidor"];
  }
}