"use strict";
import { Router } from "express";
import {
    crearEvento,
    obtenerEventos,
    actualizarEvento,
    eliminarEvento,
    inscribirAEvento,
    cancelarInscripcion,
    obtenerEventoPorId,
    obtenerMisInscripciones,
    obtenerInscritosEvento,
    marcarAsistencia,
    obtenerOrganizadores,
    obtenerEventosGestion,
    guardarBorradorEvento,
    publicarEvento
} from "../controllers/evento.controller.js";

import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { authorizeRoles } from "../middlewares/authorization.middleware.js";

const router = Router();

router
    .get("/", obtenerEventos)
    .post("/", authenticateJwt, authorizeRoles("Admin"), crearEvento)

    .get("/mis-inscripciones", authenticateJwt, obtenerMisInscripciones)
    .get("/gestion", authenticateJwt, authorizeRoles("Admin", "Voluntario"), obtenerEventosGestion)
    .get("/organizadores", authenticateJwt, authorizeRoles("Admin"), obtenerOrganizadores)

    .post("/borradores", authenticateJwt, authorizeRoles("Admin"), guardarBorradorEvento)
    .put("/borradores/:id", authenticateJwt, authorizeRoles("Admin"), guardarBorradorEvento)
    .post("/:id/publicar", authenticateJwt, authorizeRoles("Admin"), publicarEvento)

    .get("/:id", obtenerEventoPorId)
    .put("/:id", authenticateJwt, actualizarEvento)
    .delete("/:id", authenticateJwt, authorizeRoles("Admin"), eliminarEvento)

    .get("/:id/inscritos", authenticateJwt, obtenerInscritosEvento)
    .post("/:id/inscripcion", authenticateJwt, inscribirAEvento)
    .delete("/:id/inscripcion", authenticateJwt, cancelarInscripcion)
    .patch("/:eventoId/asistencia/:usuarioId", authenticateJwt, marcarAsistencia);

export default router;