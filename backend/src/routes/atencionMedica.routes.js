
"use strict";

import { Router } from "express";
import passport from "passport";

import {
    createAtencionMedicaController,
    updateAtencionMedicaController,
    deleteAtencionMedicaController
} from "../controllers/atencionMedica.controller.js";

const router = Router();

function verificarPermisosVeterinario(req, res, next) {
    if (!req.user?.activo || !["Veterinario", "Admin"].includes(req.user.rol)) {
        return res.status(403).json({
            status: "Client error",
            message: "Solo Veterinarios y Administradores pueden gestionar atenciones médicas"
        });
    }

    return next();
}

router.use(passport.authenticate("jwt", { session: false }));
router.use(verificarPermisosVeterinario);

// Registrar atención médica
router.post("/", createAtencionMedicaController);

// Editar atención médica por ID
router.put("/:id", updateAtencionMedicaController);

// Eliminar atención médica por ID
router.delete("/:id", deleteAtencionMedicaController);

export default router;
