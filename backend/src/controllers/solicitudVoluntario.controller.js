
"use strict";

import {
  obtenerSolicitudesPendientes,
  cambiarEstadoSolicitud,
} from "../services/solicitudVoluntario.service.js";

import {
  enviarCorreoDecisionVoluntario,
} from "../services/correoVoluntario.service.js";

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

async function procesarSolicitud(req, res, nuevoEstado) {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "El ID de la solicitud no es válido.",
      });
    }

    // Actualizamos el estado de la solicitud.
    const resultado = await cambiarEstadoSolicitud(
      id,
      nuevoEstado
    );

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

    // El estado ya fue actualizado correctamente.
    // Ahora intentamos notificar al voluntario.
    let notificacion = {
      enviada: false,
    };

    try {
      const correo = await enviarCorreoDecisionVoluntario(
        resultado.voluntario,
        nuevoEstado
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
        "Error al enviar correo al voluntario:",
        errorCorreo
      );

      notificacion = {
        enviada: false,
        error: "No fue posible enviar la notificación.",
      };
    }

    // Respondemos al frontend aunque falle el correo,
    // porque el estado sí quedó actualizado.
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

export async function aprobarSolicitudController(req, res) {
  return procesarSolicitud(req, res, "Aprobado");
}

export async function rechazarSolicitudController(req, res) {
  return procesarSolicitud(req, res, "Rechazado");
}
