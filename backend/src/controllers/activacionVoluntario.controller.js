
"use strict";

import {
  verificarInvitacionVoluntario,
  activarCuentaVoluntario,
} from "../services/activacionVoluntario.service.js";

// Verificar si el enlace de invitación es válido.
export async function verificarInvitacionController(req, res) {
  try {
    const { token } = req.params;

    const resultado = await verificarInvitacionVoluntario(token);

    if (resultado.error) {
      return res.status(400).json({
        message: resultado.error,
      });
    }

    return res.status(200).json({
      message: "La invitación es válida.",
      data: resultado,
    });
  } catch (error) {
    console.error("Error al verificar invitación:", error);

    return res.status(500).json({
      message: "No fue posible verificar la invitación.",
    });
  }
}

// Crear la cuenta del voluntario aprobado.
export async function activarCuentaVoluntarioController(req, res) {
  try {
    const { token, password, confirmarPassword } = req.body ?? {};

    if (
      typeof token !== "string" ||
      !token.trim() ||
      typeof password !== "string" ||
      typeof confirmarPassword !== "string"
    ) {
      return res.status(400).json({
        message: "Debes completar todos los campos.",
      });
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        message: "La contraseña debe tener entre 8 y 72 caracteres.",
      });
    }

    if (password !== confirmarPassword) {
      return res.status(400).json({
        message: "Las contraseñas no coinciden.",
      });
    }

    const resultado = await activarCuentaVoluntario(token, password);

    if (resultado.error) {
      return res.status(400).json({
        message: resultado.error,
      });
    }

    return res.status(201).json({
      message: "Tu cuenta de voluntario fue creada exitosamente.",
      data: resultado.usuario,
    });
  } catch (error) {
    console.error("Error al activar cuenta:", error);

    return res.status(500).json({
      message: "No fue posible crear la cuenta del voluntario.",
    });
  }
}
