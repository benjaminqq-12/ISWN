"use strict";
import { handleErrorClient } from "../handlers/responseHandlers.js";

export function authorizeRoles(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user) {
      return handleErrorClient(res, 401, "No autorizado: inicia sesión para continuar.");
    }
    if (!rolesPermitidos.includes(req.user.rol)) {
      return handleErrorClient(res, 403, "No tienes permisos para realizar esta acción.");
    }
    next();
  };
}