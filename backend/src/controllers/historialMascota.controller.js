"use strict";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";
import {
  getHistorialMascotaService,
  agregarEventoHistorialService,
  cambiarEstadoMascotaService,
} from "../services/historialMascota.service.js";
import {
  mascotaIdParamValidation,
  agregarEventoBodyValidation,
  cambiarEstadoMascotaBodyValidation,
} from "../validations/historialMascota.validations.js";

function responderError(res, error) {
  if (error === "Mascota no encontrada") return handleErrorClient(res, 404, error);
  if (error === "Error interno del servidor") return handleErrorServer(res, 500, error);
  return handleErrorClient(res, 400, error);
}

export async function getHistorialMascotaController(req, res) {
  try {
    const { error: errorParams, value: params } = mascotaIdParamValidation.validate(req.params);
    if (errorParams) return handleErrorClient(res, 400, errorParams.message);

    const [eventos, error] = await getHistorialMascotaService(params.id);
    if (error) return responderError(res, error);

    handleSuccess(res, 200, "Historial de la mascota", eventos);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

export async function agregarEventoHistorialController(req, res) {
  try {
    const { error: errorParams, value: params } = mascotaIdParamValidation.validate(req.params);
    if (errorParams) return handleErrorClient(res, 400, errorParams.message);

    const { error: errorBody, value: body } = agregarEventoBodyValidation.validate(req.body ?? {});
    if (errorBody) return handleErrorClient(res, 400, errorBody.message);

    const [evento, error] = await agregarEventoHistorialService(params.id, req.user.usuarioId, body);
    if (error) return responderError(res, error);

    handleSuccess(res, 201, "Evento registrado en el historial", evento);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

export async function cambiarEstadoMascotaController(req, res) {
  try {
    const { error: errorParams, value: params } = mascotaIdParamValidation.validate(req.params);
    if (errorParams) return handleErrorClient(res, 400, errorParams.message);

    const { error: errorBody, value: body } = cambiarEstadoMascotaBodyValidation.validate(req.body ?? {});
    if (errorBody) return handleErrorClient(res, 400, errorBody.message);

    const [mascota, error] = await cambiarEstadoMascotaService(params.id, req.user.usuarioId, body);
    if (error) return responderError(res, error);

    handleSuccess(res, 200, "Estado de la mascota actualizado", mascota);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}