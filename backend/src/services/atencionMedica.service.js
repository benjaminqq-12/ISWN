"use strict";

import { AppDataSource } from "../config/configDb.js";
import AtencionMedicaSchema from "../entity/atencionMedica.entity.js";
import MascotaSchema from "../entity/mascota.entity.js";

export async function createAtencionMedicaService(data) {
    try {
        const {
            mascota_id,
            atencion_tipo,
            atencion_diagnostico,
            atencion_tratamiento,
            atencion_observaciones
        } = data;

        const mascotaRepository = AppDataSource.getRepository(MascotaSchema);

        const mascota = await mascotaRepository.findOne({
            where: {
                mascota_id: mascota_id
            }
        });

        if (!mascota) {
            return [null, "La mascota no está registrada en el sistema"];
        }

        if (
            atencion_tipo !== "PREVENTIVA" &&
            atencion_tipo !== "URGENCIA"
        ) {
            return [null, "El tipo de atención debe ser PREVENTIVA o URGENCIA"];
        }

        if (
            !atencion_diagnostico ||
            atencion_diagnostico.trim() === ""
        ) {
            return [null, "El diagnóstico es obligatorio"];
        }

        if (
            !atencion_tratamiento ||
            atencion_tratamiento.trim() === ""
        ) {
            return [null, "El tratamiento es obligatorio"];
        }

        const atencionRepository =
            AppDataSource.getRepository(AtencionMedicaSchema);

        const nuevaAtencion = atencionRepository.create({
            atencion_tipo,
            atencion_diagnostico,
            atencion_tratamiento,
            atencion_observaciones,
            mascota: mascota
        });

        const atencionGuardada =
            await atencionRepository.save(nuevaAtencion);

        return [atencionGuardada, null];

    } catch (error) {
        console.error("Error al crear atención médica:", error);
        return [null, "Error interno del servidor"];
    }
}