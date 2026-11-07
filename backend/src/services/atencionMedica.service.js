"use strict";

import { AppDataSource } from "../config/configDb.js";
import AtencionMedicaSchema from "../entity/atencionmedica.entity.js";
import MascotaSchema from "../entity/mascota.entity.js";
import HistorialClinicoSchema from "../entity/historialClinico.entity.js";
import CalendarioSanidadSchema from "../entity/calendarioSanidad.entity.js";
import { Vacuna } from "../entity/vacuna.entity.js";
import { Procedimiento } from "../entity/procedimiento.entity.js";

export async function createAtencionMedicaService(data) {
    try {
        const {
            mascota_id,
            atencion_tipo,
            atencion_diagnostico,
            atencion_tratamiento,
            atencion_observaciones,
            atencion_estado_sanitario,
            vacunas,
            procedimientos
        } = data;

        // DEPURACIÓN: comprobar los datos recibidos
        console.log("Datos recibidos en la atención médica:");
        console.log("Vacunas:", vacunas);
        console.log("Procedimientos:", procedimientos);
       

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

        if (vacunas !== undefined && !Array.isArray(vacunas)) {
            return [null, "Las vacunas deben enviarse como una lista"];
        }

        if (procedimientos !== undefined && !Array.isArray(procedimientos)) {
            return [null, "Los procedimientos deben enviarse como una lista"];
        }

        const listaVacunas = vacunas || [];
        const listaProcedimientos = procedimientos || [];

        // Validación de vacunas
        for (const vacuna of listaVacunas) {
            if (
                !vacuna.vacuna_nombre ||
                vacuna.vacuna_nombre.trim() === "" ||
                !vacuna.vacuna_dosis ||
                vacuna.vacuna_dosis.trim() === "" ||
                !vacuna.vacuna_fechaAplicacion ||
                isNaN(Date.parse(vacuna.vacuna_fechaAplicacion))
            ) {
                return [
                    null,
                    "Cada vacuna debe tener nombre, dosis y fecha de aplicación válida"
                ];
            }

            // Validación de próxima dosis, si fue proporcionada
            if (
                vacuna.vacuna_proximaDosis &&
                isNaN(Date.parse(vacuna.vacuna_proximaDosis))
            ) {
                return [
                    null,
                    "La fecha de próxima dosis no es válida"
                ];
            }
        }

        // Validación de procedimientos
        for (const procedimiento of listaProcedimientos) {
            if (
                !["CLINICO", "QUIRURGICO"].includes(procedimiento.procedimiento_tipo) ||
                !procedimiento.procedimiento_descripcion ||
                procedimiento.procedimiento_descripcion.trim() === "" ||
                !procedimiento.procedimiento_fecha ||
                isNaN(Date.parse(procedimiento.procedimiento_fecha))
            ) {
                return [
                    null,
                    "Cada procedimiento debe tener tipo, descripción y fecha válida"
                ];
            }
        }

        // Transacción: atención, historial y calendario
        const resultado = await AppDataSource.transaction(async (manager) => {

            const mascotaEncontrada = await manager
                .getRepository(MascotaSchema)
                .findOne({
                    where: {
                        mascota_id: mascota_id
                    }
                });

            if (!mascotaEncontrada) {
                throw new Error("La mascota no está registrada en el sistema");
            }
            if (
                atencion_estado_sanitario === "En Observación" ||
             atencion_estado_sanitario === "En Cuarentena"
                    )                    {
    mascotaEncontrada.mascota_estado =
        atencion_estado_sanitario;

    const mascotaRepository =
        manager.getRepository(MascotaSchema);

    await mascotaRepository.save(mascotaEncontrada);
}
            const atencionRepository =
                manager.getRepository(AtencionMedicaSchema);

            // 1. Guardar atención médica
            const nuevaAtencion = atencionRepository.create({
                atencion_tipo,
                atencion_diagnostico,
                atencion_tratamiento,
                atencion_observaciones,
                mascota: mascotaEncontrada
            });

            const atencionGuardada =
                await atencionRepository.save(nuevaAtencion);

            // 2. Guardar vacunas
            const vacunaRepository = manager.getRepository(Vacuna);
            const vacunasGuardadas = [];

            for (const vacuna of listaVacunas) {

                const nuevaVacuna = vacunaRepository.create({
                    vacuna_nombre: vacuna.vacuna_nombre,
                    vacuna_dosis: vacuna.vacuna_dosis,
                    vacuna_fechaAplicacion: vacuna.vacuna_fechaAplicacion,
                    vacuna_proximaDosis: vacuna.vacuna_proximaDosis || null,
                    atencionMedica: atencionGuardada
                });

                const vacunaGuardada =
                    await vacunaRepository.save(nuevaVacuna);

                vacunasGuardadas.push(vacunaGuardada);
            }

            // 3. Guardar procedimientos
            const procedimientoRepository =
                manager.getRepository(Procedimiento);

            const procedimientosGuardados = [];

            for (const procedimiento of listaProcedimientos) {

                const nuevoProcedimiento = procedimientoRepository.create({
                    procedimiento_tipo: procedimiento.procedimiento_tipo,
                    procedimiento_descripcion: procedimiento.procedimiento_descripcion,
                    procedimiento_fecha: procedimiento.procedimiento_fecha,
                    atencionMedica: atencionGuardada
                });

                const procedimientoGuardado =
                    await procedimientoRepository.save(nuevoProcedimiento);

                procedimientosGuardados.push(procedimientoGuardado);
            }

            // 4. Crear historial clínico
            const historialRepository =
                manager.getRepository(HistorialClinicoSchema);

            const nuevoHistorial = historialRepository.create({
                historialClinico_mascota: mascotaEncontrada,
                historialClinico_atencionMedica: atencionGuardada
            });

            const historialGuardado =
                await historialRepository.save(nuevoHistorial);

            // 5. Crear calendario sanitario
            const calendarioRepository =
                manager.getRepository(CalendarioSanidadSchema);

            const eventosCalendario = [];

            // Evento de atención médica realizada
            const eventoAtencion = calendarioRepository.create({
                calendarioSanidad_tipo: "ATENCION_MEDICA",
                calendarioSanidad_descripcion:
                    `Atención ${atencion_tipo}: ${atencion_diagnostico}`,
                calendarioSanidad_fecha: new Date(atencionGuardada.atencion_fecha).toISOString().slice(0, 10),
                calendarioSanidad_estado: "REALIZADO",
                calendarioSanidad_mascota: mascotaEncontrada,
                calendarioSanidad_atencionMedica: atencionGuardada
            });

            eventosCalendario.push(
                await calendarioRepository.save(eventoAtencion)
            );

            // Eventos de vacunas
            for (const vacuna of vacunasGuardadas) {
                 console.log("Vacuna guardada:", vacuna);
                console.log("Próxima dosis guardada:", vacuna.vacuna_proximaDosis);
                // Vacuna aplicada
                const eventoVacuna = calendarioRepository.create({
                    calendarioSanidad_tipo: "VACUNACION",
                    calendarioSanidad_descripcion:
                        `Vacuna aplicada: ${vacuna.vacuna_nombre}, dosis ${vacuna.vacuna_dosis}`,
                    calendarioSanidad_fecha: vacuna.vacuna_fechaAplicacion,
                    calendarioSanidad_estado: "REALIZADO",
                    calendarioSanidad_mascota: mascotaEncontrada,
                    calendarioSanidad_atencionMedica: atencionGuardada
                });

                eventosCalendario.push(
                    await calendarioRepository.save(eventoVacuna)
                );

                // Próxima dosis, si existe una fecha
                if (vacuna.vacuna_proximaDosis) {

                    const eventoProximaDosis = calendarioRepository.create({
                        calendarioSanidad_tipo: "VACUNACION",
                        calendarioSanidad_descripcion:
                            `Próxima dosis de vacuna: ${vacuna.vacuna_nombre}`,
                        calendarioSanidad_fecha: vacuna.vacuna_proximaDosis,
                        calendarioSanidad_estado: "PENDIENTE",
                        calendarioSanidad_mascota: mascotaEncontrada,
                        calendarioSanidad_atencionMedica: atencionGuardada
                    });

                    eventosCalendario.push(
                        await calendarioRepository.save(eventoProximaDosis)
                    );
                }
            }

            // Eventos de procedimientos
            for (const procedimiento of procedimientosGuardados) {

                const eventoProcedimiento = calendarioRepository.create({
                    calendarioSanidad_tipo: "PROCEDIMIENTO",
                    calendarioSanidad_descripcion:
                        `${procedimiento.procedimiento_tipo}: ${procedimiento.procedimiento_descripcion}`,
                    calendarioSanidad_fecha: procedimiento.procedimiento_fecha,
                    calendarioSanidad_estado: "REALIZADO",
                    calendarioSanidad_mascota: mascotaEncontrada,
                    calendarioSanidad_atencionMedica: atencionGuardada
                });

                eventosCalendario.push(
                    await calendarioRepository.save(eventoProcedimiento)
                );
            }
            // Validación del estado sanitario
            const estadosSanitariosPermitidos = [
         "",
            "En Observación",
            "En Cuarentena"
                        ];

        if (
         atencion_estado_sanitario !== undefined &&
            !estadosSanitariosPermitidos.includes(
                atencion_estado_sanitario
         )
            ) {
            return [
             null,
                "El estado sanitario seleccionado no es válido"
            ];
            }
            // Resultado de la transacción
            return {
                ...atencionGuardada,
                vacunas: vacunasGuardadas,
                procedimientos: procedimientosGuardados,
                historialClinico: historialGuardado,
                calendarioSanidad: eventosCalendario
            };
        });

        return [resultado, null];

    } catch (error) {
        console.error("Error al crear atención médica:", error);

        if (error.message === "La mascota no está registrada en el sistema") {
            return [null, error.message];
        }

        return [null, "Error interno del servidor"];
    }
}