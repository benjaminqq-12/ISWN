"use strict";

import { Router } from "express";
import passport from "passport";

import {
    createAtencionMedicaController
} from "../controllers/atencionMedica.controller.js";

const router = Router();

// Registrar atención médica:
// Solo Veterinarios y Administradores
router.post(
    "/",
    passport.authenticate("jwt", { session: false }),
    (req, res, next) => {
        if (
            !req.user?.activo ||
            !["Veterinario", "Admin"].includes(req.user.rol)
        ) {
            return res.status(403).json({
                status: "Client error",
                message:
                    "Solo Veterinarios y Administradores pueden registrar atenciones médicas",
            });
        }

        return next();
    },
    createAtencionMedicaController
);

export default router;