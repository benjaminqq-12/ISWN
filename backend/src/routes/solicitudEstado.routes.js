
"use strict";

import { Router } from "express";
import passport from "passport";

import {
    crearSolicitudEstadoController,
    obtenerSolicitudesEstadoController,
    resolverSolicitudEstadoController,
    cambiarEstadoSanitarioMascotaController,
} from "../controllers/solicitudEstado.controller.js";

const router = Router();

// Verificar que el usuario tenga una sesión JWT válida.
const autenticar = passport.authenticate("jwt", {
    session: false,
});

// Verificar que el usuario esté activo y tenga uno de los roles permitidos.
const permitirRoles = (...rolesPermitidos) => {
    return (req, res, next) => {
        if (!req.user?.activo) {
            return res.status(403).json({
                status: "Client error",
                message: "El usuario no está activo o no tiene permisos.",
            });
        }

        if (!rolesPermitidos.includes(req.user.rol)) {
            return res.status(403).json({
                status: "Client error",
                message: "No tienes permisos para realizar esta acción.",
            });
        }

        next();
    };
};

router
    // Crear solicitud de cambio de estado (flujo antiguo).
    .post(
        "/",
        autenticar,
        permitirRoles("Voluntario", "Veterinario", "Admin"),
        crearSolicitudEstadoController
    )

    // Consultar solicitudes (flujo antiguo).
    .get(
        "/",
        autenticar,
        permitirRoles("Voluntario", "Veterinario", "Admin"),
        obtenerSolicitudesEstadoController
    )

    // Aprobar o rechazar una solicitud (flujo antiguo).
    .put(
        "/:id/resolver",
        autenticar,
        permitirRoles("Admin"),
        resolverSolicitudEstadoController
    )

    // Cambiar directamente el estado sanitario de una mascota.
    // Solo pueden hacerlo veterinarios activos.
    .put(
        "/:id/estado-sanitario",
        autenticar,
        permitirRoles("Veterinario"),
        cambiarEstadoSanitarioMascotaController
    );

export default router;
