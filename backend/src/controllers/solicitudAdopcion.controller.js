"use strict";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";
import { crearSolicitudAdopcionService } from "../services/solicitudAdopcion.service.js";

export async function crearSolicitudAdopcionController(req, res) {
  try {
    const [solicitud, error] = await crearSolicitudAdopcionService(req.body);
    if (error) return handleErrorClient(res, 400, error);
    handleSuccess(res, 201, "Solicitud de adopción creada", solicitud);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}