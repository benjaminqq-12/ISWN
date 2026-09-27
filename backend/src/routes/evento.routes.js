"use strict";
import { Router } from "express";
import { 
    crearEvento, 
    obtenerEventos, 
    inscribirAEvento, 
    cancelarInscripcion 
} from "../controllers/evento.controller.js";

const router = Router();

router
    .get("/", obtenerEventos)
    .post("/", crearEvento)
    .post("/:id/inscripcion", inscribirAEvento)
    .delete("/:id/inscripcion", cancelarInscripcion);

export default router;