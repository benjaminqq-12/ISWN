"use strict";
import { Router } from "express";
import {
  avanzarEstadoSolicitudController,
  crearSolicitudAdopcionController,
} from "../controllers/solicitudAdopcion.controller.js";

const router = Router();

router
  .post("/", crearSolicitudAdopcionController)
  .patch("/:id/estado", avanzarEstadoSolicitudController);

export default router;