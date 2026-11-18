"use strict";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";
import { getUsuariosService, crearUsuarioService } from "../services/usuario.service.js";
import {
  registroUsuarioBodyValidation,
  crearUsuarioBodyValidation,
} from "../validations/usuario.validations.js";
import { ROL_USUARIO } from "../config/roles.js";

function responderError(res, error) {
  if (error.startsWith("Ya existe")) return handleErrorClient(res, 409, error);
  if (error === "Error interno del servidor") return handleErrorServer(res, 500, error);
  return handleErrorClient(res, 400, error);
}

export async function getUsuariosController(req, res) {
  try {
    const [usuarios, error] = await getUsuariosService();
    if (error) return handleErrorClient(res, 404, error);
    handleSuccess(res, 200, "Usuarios encontrados", usuarios);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

// registro público: siempre crea una cuenta de rol Usuario
export async function registrarUsuarioController(req, res) {
  try {
    const { error: errorBody, value: body } = registroUsuarioBodyValidation.validate(req.body ?? {});
    if (errorBody) return handleErrorClient(res, 400, errorBody.message);

    const [usuario, error] = await crearUsuarioService({ ...body, rol: ROL_USUARIO });
    if (error) return responderError(res, error);

    handleSuccess(res, 201, "Cuenta creada exitosamente", usuario);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}

// creación por un administrador, con el rol elegido
export async function crearUsuarioController(req, res) {
  try {
    const { error: errorBody, value: body } = crearUsuarioBodyValidation.validate(req.body ?? {});
    if (errorBody) return handleErrorClient(res, 400, errorBody.message);

    const [usuario, error] = await crearUsuarioService(body);
    if (error) return responderError(res, error);

    handleSuccess(res, 201, "Usuario creado exitosamente", usuario);
  } catch (error) {
    return handleErrorServer(res, 500, error.message);
  }
}