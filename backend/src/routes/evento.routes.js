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
    marcarAsistencia
} from "../controllers/evento.controller.js";

const router = Router();

router
    .get("/", obtenerEventos)
    .post("/", crearEvento)
    .get("/mis-inscripciones", obtenerMisInscripciones)

    .get("/:id", obtenerEventoPorId)
    .put("/:id", actualizarEvento)
    .delete("/:id", eliminarEvento)

    .get("/:id/inscritos", obtenerInscritosEvento)
    .post("/:id/inscripcion", inscribirAEvento)
    .delete("/:id/inscripcion", cancelarInscripcion)
    .patch("/:eventoId/asistencia/:usuarioId", marcarAsistencia);

export default router;