"use strict";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/configDb.js";
import { ACCESS_TOKEN_SECRET } from "../config/configEnv.js";
import UsuarioSchema from "../entity/usuario.entity.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";

export async function iniciarSesionController(req, res) {
  const { usuarioEmail, usuarioPassword } = req.body || {};
  if (
    typeof usuarioEmail !== "string" ||
    !usuarioEmail.trim() ||
    typeof usuarioPassword !== "string" ||
    !usuarioPassword
  ) {
    return handleErrorClient(res, 400, "Ingrese su correo electrónico y contraseña");
  }

  try {
    const usuarioRepository = AppDataSource.getRepository(UsuarioSchema);
    const usuario = await usuarioRepository.findOne({
      where: { usuarioEmail: usuarioEmail.trim() },
    });

    const passwordValida = usuario
      ? await bcrypt.compare(usuarioPassword, usuario.usuarioPassword)
      : false;

    if (!usuario || !usuario.activo || !passwordValida) {
      return handleErrorClient(res, 401, "Correo o contraseña incorrectos");
    }

    if (!ACCESS_TOKEN_SECRET) {
      console.error("ACCESS_TOKEN_SECRET no está configurado");
      return handleErrorServer(res, 500, "El servicio de autenticación no está configurado");
    }

    const token = jwt.sign(
      { email: usuario.usuarioEmail },
      ACCESS_TOKEN_SECRET,
      { expiresIn: "8h" }
    );

    return handleSuccess(res, 200, "Sesión iniciada", {
      token,
      user: {
        usuarioId: usuario.usuarioId,
        usuarioNombre: usuario.usuarioNombre,
        usuarioEmail: usuario.usuarioEmail,
        rol: usuario.rol,
      },
    });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    return handleErrorServer(res, 500, "Error interno al iniciar sesión");
  }
}
