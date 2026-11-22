"use strict";

import { Router } from "express";
import passport from "passport";

import {
    obtenerHistorialClinicoController,
} from "../controllers/historialClinico.controller.js";

const router = Router();

// Consultar historial clínico:
// Veterinarios y Administradores
router.get(
    "/:id",
    passport.authenticate("jwt", { session: false }),
    (req, res, next) => {
        if (
            !req.user?.activo ||
            !["Veterinario", "Admin"].includes(req.user.rol)
        ) {
            return res.status(403).json({
                status: "Client error",
                message:
                    "Solo Veterinarios y Administradores pueden consultar el historial clínico",
            });
        }

        return next();
    },
    obtenerHistorialClinicoController
);

export default router;