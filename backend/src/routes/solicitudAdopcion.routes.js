"use strict";
import { Router } from "express";
import {
  crearSolicitudAdopcionController,
  avanzarEstadoSolicitudController,
  getSolicitudesController,
  getMisSolicitudesController,
} from "../controllers/solicitudAdopcion.controller.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { authorizeRoles } from "../middlewares/authorization.middleware.js";
import { ROLES_AUTORIZADORES } from "../config/estadosSolicitud.js";

const router = Router();

router.use(authenticateJwt);

router
  .get("/mias", getMisSolicitudesController)
  .get("/", authorizeRoles(...ROLES_AUTORIZADORES), getSolicitudesController)
  .post("/", crearSolicitudAdopcionController)
  .patch("/:id/estado", authorizeRoles(...ROLES_AUTORIZADORES), avanzarEstadoSolicitudController);

export default router;