
"use strict";

import { Router } from "express";
import passport from "passport";

import {
    createVacunaController,
    obtenerVacunasMascotaController
} from "../controllers/vacuna.controller.js";

const router = Router();

function verificarPermisosVeterinario(req, res, next) {
    if (!req.user?.activo) {
        return res.status(403).json({
            status: "error",
            message: "El usuario no está activo"
        });
    }

    const rol = req.user?.rol;

    if (rol !== "Veterinario" && rol !== "Admin") {
        return res.status(403).json({
            status: "error",
            message: "Solo Veterinarios y Administradores pueden gestionar vacunas"
        });
    }

    next();
}

router.use(
    passport.authenticate("jwt", { session: false }),
    verificarPermisosVeterinario
);

router.post("/", createVacunaController);

router.get(
    "/mascota/:mascotaId",
    obtenerVacunasMascotaController
);

export default router;
