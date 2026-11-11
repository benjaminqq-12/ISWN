"use strict";
import passport from "passport";
import { handleErrorClient, handleErrorServer } from "../handlers/responseHandlers.js";

export function authenticateJwt(req, res, next) {
  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (err) return handleErrorServer(res, 500, "Error interno de autenticación");
    if (!user) {
      console.log("JWT rechazado:", info?.message ?? "usuario no encontrado o inactivo");
      return handleErrorClient(res, 401, "No autorizado: inicia sesión para continuar.");
    }
    req.user = user;
    next();
  })(req, res, next);
}