"use strict";
import { Router } from "express";
import {
  getHistorialMascotaController,
  agregarEventoHistorialController,
  cambiarEstadoMascotaController,
} from "../controllers/historialMascota.controller.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { authorizeRoles } from "../middlewares/authorization.middleware.js";

const router = Router();
const soloPersonal = [authenticateJwt, authorizeRoles("Admin", "Voluntario")];

router
  .get("/:id/historial", soloPersonal, getHistorialMascotaController)
  .post("/:id/historial", soloPersonal, agregarEventoHistorialController)
  .patch("/:id/estado", soloPersonal, cambiarEstadoMascotaController);

export default router;