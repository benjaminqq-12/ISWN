"use strict";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";
import {
  crearSolicitudAdopcionService,
  avanzarEstadoSolicitudService,
  getSolicitudesService,
  getMisSolicitudesService,
  puedeSolicitarService
 } from "../services/solicitudAdopcion.service.js";
import {
  avanzarEstadoBodyValidation,
  solicitudIdValidation,
  crearSolicitudBodyValidation
} from "../validations/solicitudAdopcion.validations.js";
import { generarComprobanteService } from "../services/comprobanteAdopcion.service.js";

export async function crearSolicitudAdopcionController(req, res) {
  try {
    const { error: errorBody, value: body } = crearSolicitudBodyValidation.validate(req.body ?? {});
    if (errorBody) return handleErrorClient(res, 400, errorBody.message);

    const [solicitud, error] = await crearSolicitudAdopcionService({
      ...body,
      usuarioAdoptanteId: req.user.usuarioId,
    });
    if (error) return handleErrorClient(res, 400, error);

    handleSuccess(res, 201, "Solicitud de adopción creada", solicitud);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

export async function avanzarEstadoSolicitudController(req, res) {
  try {
    const { error: errorParams, value: params } = solicitudIdValidation.validate(req.params);
    if (errorParams) return handleErrorClient(res, 400, errorParams.message);

    const { error: errorBody, value: body } = avanzarEstadoBodyValidation.validate(req.body ?? {});
    if (errorBody) return handleErrorClient(res, 400, errorBody.message);

    const [solicitud, error] = await avanzarEstadoSolicitudService(params.id, {
      ...body,
      usuarioId: req.user.usuarioId,
    });
    if (error) return handleErrorClient(res, 400, error);

    handleSuccess(res, 200, "Estado de la solicitud actualizado", solicitud);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

export async function getSolicitudesController(req, res) {
  try {
    const [solicitudes, error] = await getSolicitudesService();
    if (error) return handleErrorServer(res, 500, error);
    handleSuccess(res, 200, "Solicitudes encontradas", solicitudes);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

export async function getMisSolicitudesController(req, res) {
  try {
    const [solicitudes, error] = await getMisSolicitudesService(req.user.usuarioId);
    if (error) return handleErrorServer(res, 500, error);
    handleSuccess(res, 200, "Tus solicitudes de adopción", solicitudes);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

export async function puedeSolicitarController(req, res) {
  try {
    const [resultado, error] = await puedeSolicitarService(req.user.usuarioId);
    if (error) return handleErrorServer(res, 500, error);
    handleSuccess(res, 200, "Verificación realizada", resultado);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

function responderErrorComprobante(res, error) {
  if (error === "La solicitud de adopción no existe.") return handleErrorClient(res, 404, error);
  if (error === "Error interno del servidor") return handleErrorServer(res, 500, error);
  return handleErrorClient(res, 400, error);
}

export async function descargarComprobanteController(req, res) {
  try {
    const { error: errorParams, value: params } = solicitudIdValidation.validate(req.params);
    if (errorParams) return handleErrorClient(res, 400, errorParams.message);

    const [pdf, error] = await generarComprobanteService(params.id, req.user);
    if (error) return responderErrorComprobante(res, error);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="comprobante-adopcion-${params.id}.pdf"`);
    return res.send(pdf);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}