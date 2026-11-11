"use strict";

import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import {
    crearVoluntarioController,
    obtenerVoluntariosController,
    obtenerVoluntarioPorIdController,
    verificarCorreoController,
} from "../controllers/voluntario.controller.js";

const router = Router();

// Limita las consultas anticipadas de correo por IP.
// Es una protección básica: no evita que se descubra si un correo está registrado.
const limitarVerificacionCorreo = rateLimit({
    windowMs: 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        message: "Demasiadas consultas. Intenta nuevamente en un minuto.",
    },
});

// Registrar una postulación
router.post("/", crearVoluntarioController);

// Obtener todos los voluntarios
router.get("/", obtenerVoluntariosController);

// Comprobar correo con límite de consultas
router.post("/verificar-correo", limitarVerificacionCorreo, verificarCorreoController);

// Obtener un voluntario por ID
router.get("/:id", obtenerVoluntarioPorIdController);

export default router;
