
"use strict";

import {
    handleErrorClient,
    handleSuccess
} from "../handlers/responseHandlers.js";

import {
    createAtencionMedicaService,
    updateAtencionMedicaService,
    deleteAtencionMedicaService
} from "../services/atencionMedica.service.js";

export async function createAtencionMedicaController(req, res) {
    try {
        const [atencion, error] = await createAtencionMedicaService(req.body);

        if (error) return handleErrorClient(res, 400, error);

        return handleSuccess(
            res,
            201,
            "Atención médica registrada correctamente",
            atencion
        );
    } catch (error) {
        console.error("Error en createAtencionMedicaController:", error);

        return res.status(500).json({
            success: false,
            message: "Error interno del servidor"
        });
    }
}

export async function updateAtencionMedicaController(req, res) {
    try {
        const [atencion, error] = await updateAtencionMedicaService(
            req.params.id,
            req.body
        );

        if (error) {
            const status = error === "La atención médica no existe" ? 404 : 400;
            return handleErrorClient(res, status, error);
        }

        return handleSuccess(
            res,
            200,
            "Atención médica actualizada correctamente",
            atencion
        );
    } catch (error) {
        console.error("Error en updateAtencionMedicaController:", error);

        return res.status(500).json({
            success: false,
            message: "Error interno del servidor"
        });
    }
}

export async function deleteAtencionMedicaController(req, res) {
    try {
        const [resultado, error] = await deleteAtencionMedicaService(req.params.id);

        if (error) {
            const status = error === "La atención médica no existe" ? 404 : 400;
            return handleErrorClient(res, status, error);
        }

        return handleSuccess(
            res,
            200,
            "Atención médica y sus registros relacionados eliminados correctamente",
            resultado
        );
    } catch (error) {
        console.error("Error en deleteAtencionMedicaController:", error);

        return res.status(500).json({
            success: false,
            message: "Error interno del servidor"
        });
    }
}
