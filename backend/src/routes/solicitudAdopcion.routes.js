"use strict";
import { Router } from "express";
import {
  crearSolicitudAdopcionController,
} from "../controllers/solicitudAdopcion.controller.js";

const router = Router();

router
  .post("/", crearSolicitudAdopcionController);

export default router;