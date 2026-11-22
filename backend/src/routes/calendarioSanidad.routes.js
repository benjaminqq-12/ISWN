"use strict";

import { Router } from "express";
import passport from "passport";

import {
    obtenerCalendarioSanidadController,
} from "../controllers/calendarioSanidad.controller.js";

const router = Router();

// Consultar calendario sanitario:
// Veterinarios, Voluntarios y Administradores
router.get(
    "/:id",
    passport.authenticate("jwt", { session: false }),
    (req, res, next) => {
        if (
            !req.user?.activo ||
            !["Veterinario", "Voluntario", "Admin"].includes(req.user.rol)
        ) {
            return res.status(403).json({
                status: "Client error",
                message:
                    "Solo Voluntarios, Veterinarios y Administradores pueden consultar el calendario sanitario",
            });
        }

        return next();
    },
    obtenerCalendarioSanidadController
);

export default router;