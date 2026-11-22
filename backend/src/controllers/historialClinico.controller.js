"use strict";

import {
    handleErrorClient,
    handleSuccess,
} from "../handlers/responseHandlers.js";

import {
    obtenerHistorialClinicoService,
} from "../services/historialClinico.service.js";

export async function obtenerHistorialClinicoController(req, res) {
    try {
        const mascotaId = Number(req.params.id);

        if (!Number.isInteger(mascotaId) || mascotaId <= 0) {
            return handleErrorClient(
                res,
                400,
                "El ID de la mascota debe ser un número entero positivo"
            );
        }

        const [historial, error] =
            await obtenerHistorialClinicoService(mascotaId);

        if (error) {
            return handleErrorClient(res, 500, error);
        }

        return handleSuccess(
            res,
            200,
            "Historial clínico obtenido correctamente",
            historial
        );
    } catch (error) {
        console.error(
            "Error en obtenerHistorialClinicoController:",
            error
        );

        return res.status(500).json({
            status: "Server error",
            message: "Error interno del servidor",
        });
    }
}