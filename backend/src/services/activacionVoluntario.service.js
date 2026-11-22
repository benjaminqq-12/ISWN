
"use strict";

import bcrypt from "bcryptjs";
import { createHash } from "node:crypto";

import { AppDataSource } from "../config/configDb.js";
import VoluntarioSchema from "../entity/voluntario.entity.js";
import UsuarioSchema from "../entity/usuario.entity.js";
import InvitacionVoluntarioSchema from "../entity/invitacionVoluntario.entity.js";

import {
  buscarInvitacionValida,
} from "./invitacionVoluntario.service.js";

import { ROL_VOLUNTARIO } from "../config/roles.js";

function generarHash(token) {
  return createHash("sha256").update(token).digest("hex");
}

// Verifica que el enlace sea válido y el voluntario esté aprobado.
export async function verificarInvitacionVoluntario(token) {
  const invitacion = await buscarInvitacionValida(token);

  if (!invitacion) {
    return {
      error: "La invitación no existe, venció o ya fue utilizada.",
    };
  }

  const voluntarioRepository = AppDataSource.getRepository(VoluntarioSchema);
  const usuarioRepository = AppDataSource.getRepository(UsuarioSchema);

  const voluntario = await voluntarioRepository.findOne({
    where: { voluntarioId: invitacion.voluntarioId },
  });

  if (!voluntario || voluntario.estado !== "Aprobado") {
    return {
      error: "El voluntario no está aprobado.",
    };
  }

  const cuentaExistente = await usuarioRepository
    .createQueryBuilder("usuario")
    .where("usuario.rut = :rut", { rut: voluntario.rut })
    .orWhere("LOWER(usuario.usuarioEmail) = LOWER(:email)", {
      email: voluntario.email,
    })
    .getOne();

  if (cuentaExistente) {
    return {
      error: "Este voluntario ya tiene una cuenta registrada.",
    };
  }

  return {
    valido: true,
    nombreCompleto: voluntario.nombreCompleto,
    email: voluntario.email,
  };
}

// Activa la cuenta mediante una transacción.
export async function activarCuentaVoluntario(token, password) {
  if (
    typeof token !== "string" ||
    !/^[a-f0-9]{64}$/.test(token)
  ) {
    return {
      error: "La invitación no es válida.",
    };
  }

  if (
    typeof password !== "string" ||
    password.length < 8 ||
    password.length > 72
  ) {
    return {
      error: "La contraseña debe tener entre 8 y 72 caracteres.",
    };
  }

  const tokenHash = generarHash(token);

  try {
    return await AppDataSource.transaction(async (manager) => {
      const invitacionRepository = manager.getRepository(
        InvitacionVoluntarioSchema
      );

      // Bloqueamos la invitación durante la activación.
      const invitacion = await invitacionRepository
        .createQueryBuilder("invitacion")
        .setLock("pessimistic_write")
        .where("invitacion.tokenHash = :tokenHash", { tokenHash })
        .getOne();

      if (
        !invitacion ||
        invitacion.utilizada ||
        new Date(invitacion.fechaExpiracion) <= new Date()
      ) {
        return {
          error: "La invitación no existe, venció o ya fue utilizada.",
        };
      }

      const voluntarioRepository = manager.getRepository(VoluntarioSchema);

      const voluntario = await voluntarioRepository.findOne({
        where: { voluntarioId: invitacion.voluntarioId },
      });

      if (!voluntario || voluntario.estado !== "Aprobado") {
        return {
          error: "El voluntario no está aprobado.",
        };
      }

      const usuarioRepository = manager.getRepository(UsuarioSchema);

      // Comprobamos que no exista una cuenta con el RUT o correo.
      const cuentaExistente = await usuarioRepository
        .createQueryBuilder("usuario")
        .where("usuario.rut = :rut", { rut: voluntario.rut })
        .orWhere("LOWER(usuario.usuarioEmail) = LOWER(:email)", {
          email: voluntario.email,
        })
        .getOne();

      if (cuentaExistente) {
        return {
          error: "Este voluntario ya tiene una cuenta registrada.",
        };
      }

      // Protegemos la contraseña antes de guardarla.
      const passwordHash = await bcrypt.hash(password, 10);

      const nuevoUsuario = usuarioRepository.create({
        rut: voluntario.rut,
        usuarioNombre: voluntario.nombreCompleto,
        usuarioEmail: voluntario.email,
        usuarioPassword: passwordHash,
        rol: ROL_VOLUNTARIO,
        activo: true,
      });

      const usuarioGuardado = await usuarioRepository.save(nuevoUsuario);

      // Marcamos la invitación como utilizada dentro de la transacción.
      invitacion.utilizada = true;
      await invitacionRepository.save(invitacion);

      const {
        usuarioPassword: _passwordOculta,
        ...usuarioPublico
      } = usuarioGuardado;

      return {
        creado: true,
        usuario: usuarioPublico,
      };
    });
  } catch (error) {
    console.error("Error al activar la cuenta del voluntario:", error);

    if (error?.driverError?.code === "23505") {
      return {
        error: "Ya existe una cuenta registrada con ese RUT o correo.",
      };
    }

    return {
      error: "No fue posible crear la cuenta. Inténtalo nuevamente.",
    };
  }
}
