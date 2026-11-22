"use strict";
import { Router } from "express";
import {
  getSeguimientosSolicitudController,
  registrarSeguimientoController,
} from "../controllers/seguimientoAdopcion.controller.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { authorizeRoles } from "../middlewares/authorization.middleware.js";

const router = Router();
const soloPersonal = [authenticateJwt, authorizeRoles("Admin", "Voluntario")];

router
  .get("/:id/seguimientos", soloPersonal, getSeguimientosSolicitudController)
  .patch("/:id/seguimientos/:seguimientoId", soloPersonal, registrarSeguimientoController);

export default router;