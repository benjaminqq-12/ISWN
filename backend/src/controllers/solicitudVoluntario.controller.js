
"use strict";

import {
  obtenerSolicitudesPendientes,
  cambiarEstadoSolicitud,
} from "../services/solicitudVoluntario.service.js";

import {
  enviarCorreoDecisionVoluntario,
} from "../services/correoVoluntario.service.js";

import {
  crearInvitacionVoluntario,
} from "../services/invitacionVoluntario.service.js";

import { AppDataSource } from "../config/configDb.js";
import VoluntarioSchema from "../entity/voluntario.entity.js";
import UsuarioSchema from "../entity/usuario.entity.js";

// Listar solicitudes pendientes.
export async function listarSolicitudesPendientesController(req, res) {
  try {
    const solicitudes = await obtenerSolicitudesPendientes();

    return res.status(200).json({
      message: "Solicitudes pendientes obtenidas correctamente.",
      data: solicitudes,
    });
  } catch (error) {
    console.error("Error al obtener solicitudes:", error);

    return res.status(500).json({
      message: "Error al obtener las solicitudes pendientes.",
    });
  }
}

// Aprobar o rechazar una solicitud.
async function procesarSolicitud(req, res, nuevoEstado) {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "El ID de la solicitud no es válido.",
      });
    }

    const resultado = await cambiarEstadoSolicitud(id, nuevoEstado);

    if (resultado.error === "NO_ENCONTRADA") {
      return res.status(404).json({
        message: "No se encontró la solicitud.",
      });
    }

    if (resultado.error === "YA_PROCESADA") {
      return res.status(409).json({
        message: "Esta solicitud ya fue procesada.",
      });
    }

    if (resultado.error) {
      return res.status(400).json({
        message: "El estado solicitado no es válido.",
      });
    }

    let notificacion = {
      enviada: false,
    };

    try {
      let enlaceActivacion = null;

      if (nuevoEstado === "Aprobado") {
        const frontendUrl = process.env.FRONTEND_URL;

        if (!frontendUrl) {
          throw new Error("Falta configurar FRONTEND_URL.");
        }

        const token = await crearInvitacionVoluntario(id);

        enlaceActivacion =
          `${frontendUrl.replace(/\/$/, "")}` +
          `/crear-cuenta-voluntario?token=${encodeURIComponent(token)}`;
      }

      const correo = await enviarCorreoDecisionVoluntario(
        resultado.voluntario,
        nuevoEstado,
        enlaceActivacion
      );

      notificacion = {
        enviada: correo.enviado,
      };

      console.log(
        `Correo de ${nuevoEstado} enviado a:`,
        resultado.voluntario.email
      );
    } catch (errorCorreo) {
      console.error(
        "Error al generar invitación o enviar correo:",
        errorCorreo
      );

      notificacion = {
        enviada: false,
        error: "No fue posible enviar la notificación.",
      };
    }

    return res.status(200).json({
      message: notificacion.enviada
        ? `Solicitud ${nuevoEstado.toLowerCase()} correctamente. Notificación enviada.`
        : `Solicitud ${nuevoEstado.toLowerCase()} correctamente, pero no se pudo enviar la notificación.`,
      data: {
        actualizado: resultado.actualizado,
        estado: resultado.estado,
        notificacion,
      },
    });
  } catch (error) {
    console.error("Error al procesar solicitud:", error);

    return res.status(500).json({
      message: "No fue posible procesar la solicitud.",
    });
  }
}

// Aprobar solicitud.
export async function aprobarSolicitudController(req, res) {
  return procesarSolicitud(req, res, "Aprobado");
}

// Rechazar solicitud.
export async function rechazarSolicitudController(req, res) {
  return procesarSolicitud(req, res, "Rechazado");
}

// NUEVO: Reenviar invitación a un voluntario aprobado.
export async function reenviarInvitacionController(req, res) {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "El ID del voluntario no es válido.",
      });
    }

    const voluntarioRepository = AppDataSource.getRepository(VoluntarioSchema);
    const usuarioRepository = AppDataSource.getRepository(UsuarioSchema);

    const voluntario = await voluntarioRepository.findOne({
      where: { voluntarioId: id },
    });

    if (!voluntario) {
      return res.status(404).json({
        message: "No se encontró el voluntario.",
      });
    }

    if (voluntario.estado !== "Aprobado") {
      return res.status(400).json({
        message: "Solo se pueden reenviar invitaciones a voluntarios aprobados.",
      });
    }

    const usuarioExistente = await usuarioRepository
      .createQueryBuilder("usuario")
      .where("usuario.rut = :rut", { rut: voluntario.rut })
      .orWhere("LOWER(usuario.usuarioEmail) = LOWER(:email)", {
        email: voluntario.email,
      })
      .getOne();

    if (usuarioExistente) {
      return res.status(409).json({
        message: "Este voluntario ya tiene una cuenta registrada.",
      });
    }

    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
      return res.status(500).json({
        message: "Falta configurar la dirección del frontend.",
      });
    }

    const token = await crearInvitacionVoluntario(id);

    const enlaceActivacion =
      `${frontendUrl.replace(/\/$/, "")}` +
      `/crear-cuenta-voluntario?token=${encodeURIComponent(token)}`;

    try {
      await enviarCorreoDecisionVoluntario(
        {
          nombreCompleto: voluntario.nombreCompleto,
          email: voluntario.email,
        },
        "Aprobado",
        enlaceActivacion
      );
    } catch (errorCorreo) {
      console.error("Error al reenviar invitación:", errorCorreo);

      return res.status(502).json({
        message: "No se pudo enviar la invitación. Puedes intentarlo nuevamente.",
      });
    }

    return res.status(200).json({
      message: "La invitación fue enviada correctamente.",
      data: {
        voluntarioId: id,
        email: voluntario.email,
        enviada: true,
      },
    });
  } catch (error) {
    console.error("Error al procesar reenvío:", error);

    return res.status(500).json({
      message: "No fue posible procesar el reenvío de la invitación.",
    });
  }
}
