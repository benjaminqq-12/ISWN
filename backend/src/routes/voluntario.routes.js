"use strict";

import { Router } from "express";

import {
    crearVoluntarioController,
    obtenerVoluntariosController,
    obtenerVoluntarioPorIdController,
} from "../controllers/voluntario.controller.js";

const router = Router();

/*
=========================================
RUTAS DE VOLUNTARIOS
=========================================
*/

// Registrar una postulación
router.post("/", crearVoluntarioController);

// Obtener todos los voluntarios
router.get("/", obtenerVoluntariosController);

// Obtener un voluntario por ID
router.get("/:id", obtenerVoluntarioPorIdController);

export default router;