"use strict";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";
import {
  crearSolicitudAdopcionService,
  avanzarEstadoSolicitudService,
 } from "../services/solicitudAdopcion.service.js";
import {
  avanzarEstadoBodyValidation,
  solicitudIdValidation,
} from "../validations/solicitudAdopcion.validations.js";

export async function crearSolicitudAdopcionController(req, res) {
  try {
    const [solicitud, error] = await crearSolicitudAdopcionService(req.body);
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

    const [solicitud, error] = await avanzarEstadoSolicitudService(params.id, body);
    if (error) return handleErrorClient(res, 400, error);

    handleSuccess(res, 200, "Estado de la solicitud actualizado", solicitud);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}