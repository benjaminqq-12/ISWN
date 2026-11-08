"use strict";

import passport from "passport";
import { handleSuccess } from "../handlers/responseHandlers.js";
import { Router } from "express";
import { iniciarSesionController } from "../controllers/auth.controller.js";

const router = Router();

router.post("/login", iniciarSesionController);

// Verifica un token contra la cuenta ACTUAL de la base de datos.
router.get("/me", passport.authenticate("jwt", { session: false }), (req, res) => {
  const { usuarioId, usuarioNombre, usuarioEmail, rol } = req.user;
  return handleSuccess(res, 200, "Sesión válida", { usuarioId, usuarioNombre, usuarioEmail, rol });
});

export default router;
