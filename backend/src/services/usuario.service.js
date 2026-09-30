"use strict";
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