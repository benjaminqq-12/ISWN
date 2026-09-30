"use strict";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";
import { getUsuariosService } from "../services/usuario.service.js";

export async function getUsuariosController(req, res) {
  try {
    const [usuarios, error] = await getUsuariosService();
    if (error) return handleErrorClient(res, 404, error);
    handleSuccess(res, 200, "Usuarios encontrados", usuarios);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}