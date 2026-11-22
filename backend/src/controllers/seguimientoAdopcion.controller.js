"use strict";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";
import {
  getSeguimientosSolicitudService,
  registrarSeguimientoService,
} from "../services/seguimientoAdopcion.service.js";
import { solicitudIdValidation } from "../validations/solicitudAdopcion.validations.js";
import {
  seguimientoParamsValidation,
  registrarSeguimientoBodyValidation,
} from "../validations/seguimientoAdopcion.validations.js";

const NO_ENCONTRADOS = ["La solicitud de adopción no existe.", "El seguimiento no existe."];

function responderError(res, error) {
  if (NO_ENCONTRADOS.includes(error)) return handleErrorClient(res, 404, error);
  if (error === "Error interno del servidor") return handleErrorServer(res, 500, error);
  return handleErrorClient(res, 400, error);
}

export async function getSeguimientosSolicitudController(req, res) {
  try {
    const { error: errorParams, value: params } = solicitudIdValidation.validate(req.params);
    if (errorParams) return handleErrorClient(res, 400, errorParams.message);

    const [seguimientos, error] = await getSeguimientosSolicitudService(params.id);
    if (error) return responderError(res, error);

    handleSuccess(res, 200, "Seguimientos de la solicitud", seguimientos);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

export async function registrarSeguimientoController(req, res) {
  try {
    const { error: errorParams, value: params } = seguimientoParamsValidation.validate(req.params);
    if (errorParams) return handleErrorClient(res, 400, errorParams.message);

    const { error: errorBody, value: body } = registrarSeguimientoBodyValidation.validate(req.body ?? {});
    if (errorBody) return handleErrorClient(res, 400, errorBody.message);

    const [seguimiento, error] = await registrarSeguimientoService(
      params.id,
      params.seguimientoId,
      req.user.usuarioId,
      body
    );
    if (error) return responderError(res, error);

    handleSuccess(res, 200, "Seguimiento registrado", seguimiento);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}