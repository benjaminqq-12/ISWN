
"use strict";

import { Router } from "express";
import passport from "passport";

import {
  crearMascotaController,
  getMascotasController,
  getMascotasInternasController,
  getMascotaController,
  getMascotaInternaController,
  actualizarMascotaController,
  eliminarMascotaController,
  revisarMascotasLoteController,
  eliminarMascotasLoteController,
} from "../controllers/mascota.controller.js";

import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { authorizeRoles } from "../middlewares/authorization.middleware.js";


const router = Router();

// Middleware compartido para personal interno.
const soloPersonal = [
  authenticateJwt,
  authorizeRoles("Admin", "Voluntario", "Veterinario"),
];

// Consultar mascotas públicas.
router.get("/", getMascotasController);

// Consultar todas las mascotas (personal interno).
router.get(
  "/interno",
  soloPersonal,
  getMascotasInternasController
);

// Consultar información interna de una mascota.
router.get(
  "/:id/interno",
  soloPersonal,
  getMascotaInternaController
);

// Consultar perfil público de una mascota.
router.get("/:id", getMascotaController);

// Registrar una mascota.
router.post("/", soloPersonal, crearMascotaController);

router.post(
  "/lote/revisar",
  soloPersonal,
  revisarMascotasLoteController
);

router.delete(
  "/lote",
  soloPersonal,
  eliminarMascotasLoteController
);

// Actualizar una mascota.
router.put("/:id", soloPersonal, actualizarMascotaController);

// Eliminar una mascota.
router.delete("/:id", soloPersonal, eliminarMascotaController);

export default router;
