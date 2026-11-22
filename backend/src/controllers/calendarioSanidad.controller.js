"use strict";

import {
    handleErrorClient,
    handleSuccess,
} from "../handlers/responseHandlers.js";

import {
    obtenerCalendarioSanidadService,
} from "../services/calendarioSanidad.service.js";

export async function obtenerCalendarioSanidadController(req, res) {
    try {
        const mascotaId = Number(req.params.id);

        if (!Number.isInteger(mascotaId) || mascotaId <= 0) {
            return handleErrorClient(
                res,
                400,
                "El ID de la mascota debe ser un número entero positivo"
            );
        }

        const [eventos, error] =
            await obtenerCalendarioSanidadService(mascotaId);

        if (error) {
            return handleErrorClient(res, 500, error);
        }

        return handleSuccess(
            res,
            200,
            "Calendario sanitario obtenido correctamente",
            eventos
        );
    } catch (error) {
        console.error(
            "Error en obtenerCalendarioSanidadController:",
            error
        );

        return res.status(500).json({
            status: "Server error",
            message: "Error interno del servidor",
        });
    }
}