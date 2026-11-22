"use strict";

import { AppDataSource } from "../config/configDb.js";
import CalendarioSanidadSchema from "../entity/calendarioSanidad.entity.js";

export async function obtenerCalendarioSanidadService(mascotaId) {
    try {
        const calendarioRepository =
            AppDataSource.getRepository(CalendarioSanidadSchema);

        const eventos = await calendarioRepository.find({
            where: {
                calendarioSanidad_mascota: {
                    mascota_id: mascotaId,
                },
            },
            relations: {
                calendarioSanidad_atencionMedica: true,
            },
            order: {
                calendarioSanidad_fecha: "ASC",
            },
        });

        return [eventos, null];
    } catch (error) {
        console.error("Error al consultar el calendario sanitario:", error);
        return [null, "Error interno al consultar el calendario sanitario"];
    }
}