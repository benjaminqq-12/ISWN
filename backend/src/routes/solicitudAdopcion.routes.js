"use strict";
import { Router } from "express";
import {
  avanzarEstadoSolicitudController,
  crearSolicitudAdopcionController,
  getSolicitudesController
} from "../controllers/solicitudAdopcion.controller.js";

const router = Router();

router
  .get("/", getSolicitudesController)
  .post("/", crearSolicitudAdopcionController)
  .patch("/:id/estado", avanzarEstadoSolicitudController);

export default router;