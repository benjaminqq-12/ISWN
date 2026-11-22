
"use strict";

import {
    handleErrorClient,
    handleSuccess
} from "../handlers/responseHandlers.js";

import {
    createVacunaService,
    obtenerVacunasMascotaService
} from "../services/vacuna.service.js";

export async function createVacunaController(req, res) {
    try {
        const [vacuna, error] = await createVacunaService(req.body);

        if (error) {
            return handleErrorClient(res, 400, error);
        }

        return handleSuccess(
            res,
            201,
            "Vacuna registrada correctamente",
            vacuna
        );

    } catch (error) {
        console.error("Error en createVacunaController:", error);

        return handleErrorClient(
            res,
            500,
            "Error interno del servidor"
        );
    }
}

export async function obtenerVacunasMascotaController(req, res) {
    try {
        const [vacunas, error] = await obtenerVacunasMascotaService(
            req.params.mascotaId
        );

        if (error) {
            return handleErrorClient(res, 400, error);
        }

        return handleSuccess(
            res,
            200,
            "Vacunas obtenidas correctamente",
            vacunas
        );

    } catch (error) {
        console.error("Error al consultar vacunas:", error);

        return handleErrorClient(
            res,
            500,
            "Error interno del servidor"
        );
    }
}
