
"use strict";

import { Router } from "express";

import {
  authenticateJwt,
} from "../middlewares/authentication.middleware.js";

import {
  authorizeRoles,
} from "../middlewares/authorization.middleware.js";

import {
  listarSolicitudesPendientesController,
  aprobarSolicitudController,
  rechazarSolicitudController,
  reenviarInvitacionController,
} from "../controllers/solicitudVoluntario.controller.js";

const router = Router();

// Todas las rutas requieren un administrador autenticado.
router.use(authenticateJwt);
router.use(authorizeRoles("Admin"));

// Consultar postulaciones pendientes.
router.get(
  "/pendientes",
  listarSolicitudesPendientesController
);

// Aprobar una postulación.
router.patch(
  "/:id/aprobar",
  aprobarSolicitudController
);

// Rechazar una postulación.
router.patch(
  "/:id/rechazar",
  rechazarSolicitudController
);

// NUEVO: Reenviar invitación a un voluntario aprobado.
router.post(
  "/:id/reenviar-invitacion",
  reenviarInvitacionController
);

export default router;
