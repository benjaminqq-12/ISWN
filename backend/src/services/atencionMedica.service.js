"use strict";

import { AppDataSource } from "../config/configDb.js";
import AtencionMedicaSchema from "../entity/atencionmedica.entity.js";
import MascotaSchema from "../entity/mascota.entity.js";
import HistorialClinicoSchema from "../entity/historialClinico.entity.js";
import CalendarioSanidadSchema from "../entity/calendarioSanidad.entity.js";
import { Vacuna } from "../entity/vacuna.entity.js";
import { Procedimiento } from "../entity/procedimiento.entity.js";

const estadosSanitariosPermitidos = [
    "",
    "En Observación",
    "En Cuarentena"
];

// Convierte una fecha YYYY-MM-DD a una fecha local al mediodía.
// Así evitamos que la conversión de zona horaria cambie el día.
function convertirFechaAtencion(fecha) {
    if (!fecha) return undefined;

    return new Date(`${fecha}T12:00:00`);
}

// Valida los datos recibidos desde el frontend.
function validarDatosAtencion(data) {
    const {
        atencion_tipo,
        atencion_diagnostico,
        atencion_tratamiento,
        atencion_estado_sanitario,
        atencion_fecha,
        vacunas,
        procedimientos
    } = data;

    if (
        atencion_tipo !== "PREVENTIVA" &&
        atencion_tipo !== "URGENCIA"
    ) {
        return "El tipo de atención debe ser PREVENTIVA o URGENCIA";
    }

    if (
        !atencion_diagnostico ||
        atencion_diagnostico.trim() === ""
    ) {
        return "El diagnóstico es obligatorio";
    }

    if (
        !atencion_tratamiento ||
        atencion_tratamiento.trim() === ""
    ) {
        return "El tratamiento es obligatorio";
    }

    // VALIDACIÓN DE LA FECHA DE ATENCIÓN
    if (atencion_fecha !== undefined && atencion_fecha !== null) {
        if (
            typeof atencion_fecha !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(atencion_fecha)
        ) {
            return "La fecha de atención debe tener el formato YYYY-MM-DD";
        }

        const [anio, mes, dia] = atencion_fecha
            .split("-")
            .map(Number);

        const fechaComprobacion = new Date(
            Date.UTC(anio, mes - 1, dia)
        );

        const fechaValida =
            fechaComprobacion.getUTCFullYear() === anio &&
            fechaComprobacion.getUTCMonth() === mes - 1 &&
            fechaComprobacion.getUTCDate() === dia;

        if (!fechaValida) {
            return "La fecha de atención no es válida";
        }

        const hoy = new Date();

        const anioActual = hoy.getFullYear();
        const mesActual = String(hoy.getMonth() + 1).padStart(2, "0");
        const diaActual = String(hoy.getDate()).padStart(2, "0");

        const fechaActual =
            `${anioActual}-${mesActual}-${diaActual}`;

        if (atencion_fecha > fechaActual) {
            return "La fecha de atención no puede ser futura";
        }
    }

    if (
        atencion_estado_sanitario !== undefined &&
        !estadosSanitariosPermitidos.includes(
            atencion_estado_sanitario
        )
    ) {
        return "El estado sanitario seleccionado no es válido";
    }

    if (vacunas !== undefined && !Array.isArray(vacunas)) {
        return "Las vacunas deben enviarse como una lista";
    }

    if (
        procedimientos !== undefined &&
        !Array.isArray(procedimientos)
    ) {
        return "Los procedimientos deben enviarse como una lista";
    }

    for (const vacuna of vacunas || []) {
        if (
            !vacuna.vacuna_nombre ||
            vacuna.vacuna_nombre.trim() === "" ||
            !vacuna.vacuna_dosis ||
            vacuna.vacuna_dosis.trim() === "" ||
            !vacuna.vacuna_fechaAplicacion ||
            isNaN(Date.parse(vacuna.vacuna_fechaAplicacion))
        ) {
            return "Cada vacuna debe tener nombre, dosis y fecha de aplicación válida";
        }

        if (
            vacuna.vacuna_proximaDosis &&
            isNaN(Date.parse(vacuna.vacuna_proximaDosis))
        ) {
            return "La fecha de próxima dosis no es válida";
        }
    }

    for (const procedimiento of procedimientos || []) {
        if (
            !["CLINICO", "QUIRURGICO"].includes(
                procedimiento.procedimiento_tipo
            ) ||
            !procedimiento.procedimiento_descripcion ||
            procedimiento.procedimiento_descripcion.trim() === "" ||
            !procedimiento.procedimiento_fecha ||
            isNaN(Date.parse(procedimiento.procedimiento_fecha))
        ) {
            return "Cada procedimiento debe tener tipo, descripción y fecha válida";
        }
    }

    return null;
}

// Actualiza el estado sanitario de la mascota.
async function actualizarEstadoMascota(manager, mascota, estado) {
    if (estado === undefined || estado === "") return;

    mascota.mascota_estado = estado;

    await manager
        .getRepository(MascotaSchema)
        .save(mascota);
}

// Guarda las vacunas relacionadas con una atención.
async function guardarVacunas(manager, atencion, listaVacunas) {
    const repository = manager.getRepository(Vacuna);
    const guardadas = [];

    for (const vacuna of listaVacunas) {
        const nuevaVacuna = repository.create({
            vacuna_nombre: vacuna.vacuna_nombre,
            vacuna_dosis: vacuna.vacuna_dosis,
            vacuna_fechaAplicacion: vacuna.vacuna_fechaAplicacion,
            vacuna_proximaDosis:
                vacuna.vacuna_proximaDosis || null,
            atencionMedica: atencion
        });

        guardadas.push(
            await repository.save(nuevaVacuna)
        );
    }

    return guardadas;
}

// Guarda los procedimientos relacionados con una atención.
async function guardarProcedimientos(
    manager,
    atencion,
    listaProcedimientos
) {
    const repository = manager.getRepository(Procedimiento);
    const guardados = [];

    for (const procedimiento of listaProcedimientos) {
        const nuevoProcedimiento = repository.create({
            procedimiento_tipo:
                procedimiento.procedimiento_tipo,
            procedimiento_descripcion:
                procedimiento.procedimiento_descripcion,
            procedimiento_fecha:
                procedimiento.procedimiento_fecha,
            atencionMedica: atencion
        });

        guardados.push(
            await repository.save(nuevoProcedimiento)
        );
    }

    return guardados;
}

// Crea los eventos correspondientes en el calendario sanitario.
async function crearEventosCalendario(
    manager,
    mascota,
    atencion,
    vacunas,
    procedimientos
) {
    const repository = manager.getRepository(
        CalendarioSanidadSchema
    );

    const eventos = [];

    // EVENTO DE ATENCIÓN MÉDICA
    const eventoAtencion = repository.create({
        calendarioSanidad_tipo: "ATENCION_MEDICA",

        calendarioSanidad_descripcion:
            `Atención ${atencion.atencion_tipo}: ${atencion.atencion_diagnostico}`,

        calendarioSanidad_fecha:
            new Date(atencion.atencion_fecha)
                .toISOString()
                .slice(0, 10),

        calendarioSanidad_estado: "REALIZADO",

        calendarioSanidad_mascota: mascota,

        calendarioSanidad_atencionMedica: atencion
    });

    eventos.push(
        await repository.save(eventoAtencion)
    );

    // EVENTOS DE VACUNACIÓN
    for (const vacuna of vacunas) {
        const eventoVacuna = repository.create({
            calendarioSanidad_tipo: "VACUNACION",

            calendarioSanidad_descripcion:
                `Vacuna aplicada: ${vacuna.vacuna_nombre}, dosis ${vacuna.vacuna_dosis}`,

            calendarioSanidad_fecha:
                vacuna.vacuna_fechaAplicacion,

            calendarioSanidad_estado: "REALIZADO",

            calendarioSanidad_mascota: mascota,

            calendarioSanidad_atencionMedica: atencion
        });

        eventos.push(
            await repository.save(eventoVacuna)
        );

        // PRÓXIMA DOSIS
        if (vacuna.vacuna_proximaDosis) {
            const eventoProximaDosis = repository.create({
                calendarioSanidad_tipo: "VACUNACION",

                calendarioSanidad_descripcion:
                    `Próxima dosis de vacuna: ${vacuna.vacuna_nombre}`,

                calendarioSanidad_fecha:
                    vacuna.vacuna_proximaDosis,

                calendarioSanidad_estado: "PENDIENTE",

                calendarioSanidad_mascota: mascota,

                calendarioSanidad_atencionMedica: atencion
            });

            eventos.push(
                await repository.save(eventoProximaDosis)
            );
        }
    }

    // EVENTOS DE PROCEDIMIENTOS
    for (const procedimiento of procedimientos) {
        const eventoProcedimiento = repository.create({
            calendarioSanidad_tipo: "PROCEDIMIENTO",

            calendarioSanidad_descripcion:
                `${procedimiento.procedimiento_tipo}: ${procedimiento.procedimiento_descripcion}`,

            calendarioSanidad_fecha:
                procedimiento.procedimiento_fecha,

            calendarioSanidad_estado: "REALIZADO",

            calendarioSanidad_mascota: mascota,

            calendarioSanidad_atencionMedica: atencion
        });

        eventos.push(
            await repository.save(eventoProcedimiento)
        );
    }

    return eventos;
}

// ======================================================
// CREAR ATENCIÓN MÉDICA
// ======================================================

export async function createAtencionMedicaService(data) {
    try {
        const errorValidacion = validarDatosAtencion(data);

        if (errorValidacion) {
            return [null, errorValidacion];
        }

        const {
            mascota_id,
            atencion_tipo,
            atencion_diagnostico,
            atencion_tratamiento,
            atencion_observaciones,
            atencion_estado_sanitario,
            atencion_fecha,
            vacunas = [],
            procedimientos = []
        } = data;

        const resultado = await AppDataSource.transaction(
            async (manager) => {
                const mascotaRepository =
                    manager.getRepository(MascotaSchema);

                const mascota = await mascotaRepository.findOne({
                    where: { mascota_id }
                });

                if (!mascota) {
                    throw new Error(
                        "La mascota no está registrada en el sistema"
                    );
                }

                await actualizarEstadoMascota(
                    manager,
                    mascota,
                    atencion_estado_sanitario
                );

                const atencionRepository =
                    manager.getRepository(AtencionMedicaSchema);

                const datosNuevaAtencion = {
                    atencion_tipo,
                    atencion_diagnostico,
                    atencion_tratamiento,
                    atencion_observaciones,
                    mascota
                };

                // Si se envía una fecha, se utiliza.
                // Si no, se conserva el valor automático de la entidad.
                if (atencion_fecha) {
                    datosNuevaAtencion.atencion_fecha =
                        convertirFechaAtencion(atencion_fecha);
                }

                const nuevaAtencion =
                    atencionRepository.create(datosNuevaAtencion);

                const atencionGuardada =
                    await atencionRepository.save(nuevaAtencion);

                const vacunasGuardadas = await guardarVacunas(
                    manager,
                    atencionGuardada,
                    vacunas
                );

                const procedimientosGuardados =
                    await guardarProcedimientos(
                        manager,
                        atencionGuardada,
                        procedimientos
                    );

                const historialRepository =
                    manager.getRepository(HistorialClinicoSchema);

                const historial = historialRepository.create({
                    historialClinico_mascota: mascota,
                    historialClinico_atencionMedica:
                        atencionGuardada
                });

                const historialGuardado =
                    await historialRepository.save(historial);

                const eventosCalendario =
                    await crearEventosCalendario(
                        manager,
                        mascota,
                        atencionGuardada,
                        vacunasGuardadas,
                        procedimientosGuardados
                    );

                return {
                    ...atencionGuardada,
                    vacunas: vacunasGuardadas,
                    procedimientos: procedimientosGuardados,
                    historialClinico: historialGuardado,
                    calendarioSanidad: eventosCalendario
                };
            }
        );

        return [resultado, null];

    } catch (error) {
        console.error(
            "Error al crear atención médica:",
            error
        );

        return [
            null,
            error.message ===
            "La mascota no está registrada en el sistema"
                ? error.message
                : "Error interno del servidor"
        ];
    }
}

// ======================================================
// ACTUALIZAR ATENCIÓN MÉDICA
// ======================================================

export async function updateAtencionMedicaService(
    atencionId,
    data
) {
    try {
        const id = Number(atencionId);

        if (!Number.isInteger(id) || id <= 0) {
            return [
                null,
                "El ID de la atención debe ser un número entero positivo"
            ];
        }

        const errorValidacion = validarDatosAtencion(data);

        if (errorValidacion) {
            return [null, errorValidacion];
        }

        const resultado = await AppDataSource.transaction(
            async (manager) => {
                const atencionRepository =
                    manager.getRepository(AtencionMedicaSchema);

                const atencion = await atencionRepository.findOne({
                    where: { atencion_id: id },
                    relations: { mascota: true }
                });

                if (!atencion) {
                    throw new Error(
                        "La atención médica no existe"
                    );
                }

                atencion.atencion_tipo = data.atencion_tipo;

                atencion.atencion_diagnostico =
                    data.atencion_diagnostico;

                atencion.atencion_tratamiento =
                    data.atencion_tratamiento;

                atencion.atencion_observaciones =
                    data.atencion_observaciones ?? null;

                // ACTUALIZAR FECHA DE ATENCIÓN
                if (data.atencion_fecha) {
                    atencion.atencion_fecha =
                        convertirFechaAtencion(
                            data.atencion_fecha
                        );
                }

                await atencionRepository.save(atencion);

                await actualizarEstadoMascota(
                    manager,
                    atencion.mascota,
                    data.atencion_estado_sanitario
                );

                const vacunaRepository =
                    manager.getRepository(Vacuna);

                const procedimientoRepository =
                    manager.getRepository(Procedimiento);

                const calendarioRepository =
                    manager.getRepository(CalendarioSanidadSchema);

                let vacunasActuales =
                    await vacunaRepository.find({
                        where: {
                            atencionMedica: {
                                atencion_id: id
                            }
                        }
                    });

                let procedimientosActuales =
                    await procedimientoRepository.find({
                        where: {
                            atencionMedica: {
                                atencion_id: id
                            }
                        }
                    });

                if (data.vacunas !== undefined) {
                    await vacunaRepository.remove(
                        vacunasActuales
                    );

                    vacunasActuales = await guardarVacunas(
                        manager,
                        atencion,
                        data.vacunas
                    );
                }

                if (data.procedimientos !== undefined) {
                    await procedimientoRepository.remove(
                        procedimientosActuales
                    );

                    procedimientosActuales =
                        await guardarProcedimientos(
                            manager,
                            atencion,
                            data.procedimientos
                        );
                }

                // ACTUALIZAR EVENTOS DEL CALENDARIO
                const eventosAnteriores =
                    await calendarioRepository.find({
                        where: {
                            calendarioSanidad_atencionMedica: {
                                atencion_id: id
                            }
                        }
                    });

                await calendarioRepository.remove(
                    eventosAnteriores
                );

                const eventosNuevos =
                    await crearEventosCalendario(
                        manager,
                        atencion.mascota,
                        atencion,
                        vacunasActuales,
                        procedimientosActuales
                    );

                return {
                    ...atencion,
                    vacunas: vacunasActuales,
                    procedimientos: procedimientosActuales,
                    calendarioSanidad: eventosNuevos
                };
            }
        );

        return [resultado, null];

    } catch (error) {
        console.error(
            "Error al actualizar atención médica:",
            error
        );

        return [
            null,
            error.message === "La atención médica no existe"
                ? error.message
                : "Error interno del servidor"
        ];
    }
}

// ======================================================
// ELIMINAR ATENCIÓN MÉDICA
// ======================================================

export async function deleteAtencionMedicaService(atencionId) {
    try {
        const id = Number(atencionId);

        if (!Number.isInteger(id) || id <= 0) {
            return [
                null,
                "El ID de la atención debe ser un número entero positivo"
            ];
        }

        await AppDataSource.transaction(async (manager) => {
            const atencionRepository =
                manager.getRepository(AtencionMedicaSchema);

            const atencion = await atencionRepository.findOne({
                where: { atencion_id: id }
            });

            if (!atencion) {
                throw new Error(
                    "La atención médica no existe"
                );
            }

            const historialRepository =
                manager.getRepository(HistorialClinicoSchema);

            const vacunaRepository =
                manager.getRepository(Vacuna);

            const procedimientoRepository =
                manager.getRepository(Procedimiento);

            const calendarioRepository =
                manager.getRepository(CalendarioSanidadSchema);

            const historial = await historialRepository.find({
                where: {
                    historialClinico_atencionMedica: {
                        atencion_id: id
                    }
                }
            });

            const vacunas = await vacunaRepository.find({
                where: {
                    atencionMedica: {
                        atencion_id: id
                    }
                }
            });

            const procedimientos =
                await procedimientoRepository.find({
                    where: {
                        atencionMedica: {
                            atencion_id: id
                        }
                    }
                });

            const eventos = await calendarioRepository.find({
                where: {
                    calendarioSanidad_atencionMedica: {
                        atencion_id: id
                    }
                }
            });

            if (eventos.length) {
                await calendarioRepository.remove(eventos);
            }

            if (vacunas.length) {
                await vacunaRepository.remove(vacunas);
            }

            if (procedimientos.length) {
                await procedimientoRepository.remove(
                    procedimientos
                );
            }

            if (historial.length) {
                await historialRepository.remove(historial);
            }

            await atencionRepository.remove(atencion);
        });

        return [true, null];

    } catch (error) {
        console.error(
            "Error al eliminar atención médica:",
            error
        );

        return [
            null,
            error.message === "La atención médica no existe"
                ? error.message
                : "Error interno del servidor"
        ];
    }
}