"use strict";

import { Router } from "express";
import { 
    crearDonacion,
    confirmarDonacion,
    eliminarDonacionPendiente,
    obtenerConfiguracionDonaciones,
    obtenerAnimalesApadrinables,
    obtenerEstadoAporte,
    exportarRecaudacion,
    desactivarSuscripcion,
    obtenerRecaudacion
} from "../controllers/donacion.controller.js";

import { authenticateJwt } from "../middlewares/authentication.middleware.js"
import { authorizeRoles } from "../middlewares/authorization.middleware.js"

const router = Router();

router
    .get("/configuracion", obtenerConfiguracionDonaciones)
    .get("/animales", obtenerAnimalesApadrinables)
    .post("/", authenticateJwt, crearDonacion)
    .get("/estado/:id", obtenerEstadoAporte)
    .get("/gestion", authenticateJwt, authorizeRoles("Admin", "Voluntario"), obtenerRecaudacion)
    .get("/gestion/exportar", authenticateJwt, authorizeRoles("Admin", "Voluntario"), exportarRecaudacion)
    .patch("/:id/confirmar", authenticateJwt, authorizeRoles("Admin"), confirmarDonacion)
    .delete("/:id/pendiente", authenticateJwt, authorizeRoles("Admin"), eliminarDonacionPendiente)
    .patch("/suscripciones/:id/desactivar", authenticateJwt, authorizeRoles("Admin"), desactivarSuscripcion);

export default router;