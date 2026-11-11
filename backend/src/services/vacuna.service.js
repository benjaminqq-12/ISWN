
"use strict";

import { AppDataSource } from "../config/configDb.js";
import MascotaSchema from "../entity/mascota.entity.js";
import { Vacuna } from "../entity/vacuna.entity.js";
import CalendarioSanidadSchema from "../entity/calendarioSanidad.entity.js";

function validarDatosVacuna(data) {
    const {
        mascota_id,
        vacuna_nombre,
        vacuna_dosis,
        vacuna_fechaAplicacion,
        vacuna_proximaDosis
    } = data;

    if (!Number.isInteger(Number(mascota_id)) || Number(mascota_id) <= 0) {
        return "Debe seleccionar una mascota válida";
    }

    if (!vacuna_nombre || vacuna_nombre.trim() === "") {
        return "El nombre de la vacuna es obligatorio";
    }

    if (!vacuna_dosis || vacuna_dosis.trim() === "") {
        return "La dosis de la vacuna es obligatoria";
    }

    if (
        !vacuna_fechaAplicacion ||
        isNaN(Date.parse(vacuna_fechaAplicacion))
    ) {
        return "La fecha de aplicación no es válida";
    }

    if (
        vacuna_proximaDosis &&
        isNaN(Date.parse(vacuna_proximaDosis))
    ) {
        return "La fecha de próxima dosis no es válida";
    }

    if (
        vacuna_proximaDosis &&
        vacuna_proximaDosis < vacuna_fechaAplicacion
    ) {
        return "La próxima dosis no puede ser anterior a la fecha de aplicación";
    }

    return null;
}

export async function createVacunaService(data) {
    try {
        const errorValidacion = validarDatosVacuna(data);

        if (errorValidacion) {
            return [null, errorValidacion];
        }

        const resultado = await AppDataSource.transaction(async (manager) => {
            const mascotaRepository = manager.getRepository(MascotaSchema);

            const mascota = await mascotaRepository.findOne({
                where: {
                    mascota_id: Number(data.mascota_id)
                }
            });

            if (!mascota) {
                throw new Error("La mascota no está registrada en el sistema");
            }

            const vacunaRepository = manager.getRepository(Vacuna);

            const nuevaVacuna = vacunaRepository.create({
                vacuna_nombre: data.vacuna_nombre.trim(),
                vacuna_dosis: data.vacuna_dosis.trim(),
                vacuna_fechaAplicacion: data.vacuna_fechaAplicacion,
                vacuna_proximaDosis: data.vacuna_proximaDosis || null,
                mascota,
                atencionMedica: null
            });

            const vacunaGuardada = await vacunaRepository.save(nuevaVacuna);

            const calendarioRepository = manager.getRepository(
                CalendarioSanidadSchema
            );

            const eventoAplicacion = calendarioRepository.create({
                calendarioSanidad_tipo: "VACUNACION",
                calendarioSanidad_descripcion:
                    `Vacuna aplicada: ${vacunaGuardada.vacuna_nombre}, dosis ${vacunaGuardada.vacuna_dosis}`,
                calendarioSanidad_fecha: vacunaGuardada.vacuna_fechaAplicacion,
                calendarioSanidad_estado: "REALIZADO",
                calendarioSanidad_mascota: mascota,
                calendarioSanidad_atencionMedica: null
            });

            await calendarioRepository.save(eventoAplicacion);

            let eventoProximaDosis = null;

            if (vacunaGuardada.vacuna_proximaDosis) {
                eventoProximaDosis = calendarioRepository.create({
                    calendarioSanidad_tipo: "VACUNACION",
                    calendarioSanidad_descripcion:
                        `Próxima dosis de vacuna: ${vacunaGuardada.vacuna_nombre}`,
                    calendarioSanidad_fecha: vacunaGuardada.vacuna_proximaDosis,
                    calendarioSanidad_estado: "PENDIENTE",
                    calendarioSanidad_mascota: mascota,
                    calendarioSanidad_atencionMedica: null
                });

                await calendarioRepository.save(eventoProximaDosis);
            }

            return {
                vacuna: vacunaGuardada,
                mascota,
                calendarioSanidad: [
                    eventoAplicacion,
                    ...(eventoProximaDosis ? [eventoProximaDosis] : [])
                ]
            };
        });

        return [resultado, null];

    } catch (error) {
        console.error("Error al registrar vacuna:", error);

        return [
            null,
            error.message === "La mascota no está registrada en el sistema"
                ? error.message
                : "Error interno del servidor"
        ];
    }
}

export async function obtenerVacunasMascotaService(mascotaId) {
    try {
        const id = Number(mascotaId);

        if (!Number.isInteger(id) || id <= 0) {
            return [null, "El ID de la mascota no es válido"];
        }

        const mascotaRepository = AppDataSource.getRepository(MascotaSchema);

        const mascota = await mascotaRepository.findOne({
            where: { mascota_id: id }
        });

        if (!mascota) {
            return [null, "La mascota no está registrada en el sistema"];
        }

        const vacunaRepository = AppDataSource.getRepository(Vacuna);

        const vacunas = await vacunaRepository.find({
            where: {
                mascota: {
                    mascota_id: id
                }
            },
            relations: {
                mascota: true,
                atencionMedica: true
            },
            order: {
                vacuna_fechaAplicacion: "DESC"
            }
        });

        return [vacunas, null];

    } catch (error) {
        console.error("Error al consultar vacunas:", error);

        return [null, "Error interno al consultar las vacunas"];
    }
}
