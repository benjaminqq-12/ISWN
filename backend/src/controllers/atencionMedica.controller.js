"use strict";

import {
    handleErrorClient,
    handleSuccess
} from "../handlers/responseHandlers.js";

import {
    createAtencionMedicaService
} from "../services/atencionMedica.service.js";


export async function createAtencionMedicaController(req, res) {

    try {

        const [atencion, error] =
            await createAtencionMedicaService(req.body);

        if (error) {
            return handleErrorClient(res, 400, error);
        }

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
            message: "Error interno del servidor",
            error: error.message
        });
    }
}