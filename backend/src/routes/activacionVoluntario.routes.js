"use strict";

import { Router } from "express";

import {
  verificarInvitacionController,
  activarCuentaVoluntarioController,
} from "../controllers/activacionVoluntario.controller.js";

const router = Router();

// Verificar el enlace recibido por correo.
router.get("/verificar/:token", verificarInvitacionController);

// Crear la cuenta del voluntario aprobado.
router.post("/activar", activarCuentaVoluntarioController);

export default router;
