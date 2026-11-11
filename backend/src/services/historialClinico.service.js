"use strict";

import { AppDataSource } from "../config/configDb.js";
import HistorialClinicoSchema from "../entity/historialClinico.entity.js";

export async function obtenerHistorialClinicoService(mascotaId) {
    try {
        const historialRepository =
            AppDataSource.getRepository(HistorialClinicoSchema);

        const historial = await historialRepository.find({
            where: {
                historialClinico_mascota: {
                    mascota_id: mascotaId,
                },
            },
            relations: {
                historialClinico_atencionMedica: true,
            },
            order: {
                historialClinico_id: "DESC",
            },
        });

        return [historial, null];
    } catch (error) {
        console.error("Error al consultar el historial clínico:", error);
        return [null, "Error interno al consultar el historial clínico"];
    }
}