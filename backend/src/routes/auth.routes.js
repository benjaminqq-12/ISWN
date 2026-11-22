"use strict";

import passport from "passport";
import { handleSuccess } from "../handlers/responseHandlers.js";
import { Router } from "express";
import { iniciarSesionController } from "../controllers/auth.controller.js";
import { registrarUsuarioController } from "../controllers/usuario.controller.js";

const router = Router();

router.post("/login", iniciarSesionController);
router.post("/register", registrarUsuarioController);

// Verifica un token contra la cuenta ACTUAL de la base de datos.
router.get(
  "/me",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const {
      usuarioId,
      usuarioNombre,
      usuarioEmail,
      rol,
      activo,
    } = req.user;

    return handleSuccess(res, 200, "Sesión válida", {
      usuarioId,
      usuarioNombre,
      usuarioEmail,
      rol,
      activo,
    });
  }
);

export default router;
