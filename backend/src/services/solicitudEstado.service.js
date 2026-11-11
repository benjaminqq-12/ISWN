
"use strict";

import { AppDataSource } from "../config/configDb.js";
import SolicitudEstadoSchema from "../entity/solicitudEstado.entity.js";
import MascotaSchema from "../entity/mascota.entity.js";
import UsuarioSchema from "../entity/usuario.entity.js";

// Estados permitidos para el flujo antiguo de solicitudes
const ESTADOS_SOLICITUD_PERMITIDOS = [
    "En Cuarentena",
    "En Observación",
];

// Estados que puede asignar directamente el veterinario
// Incluye En Refugio para indicar que la mascota se recuperó.
const ESTADOS_SANITARIOS_PERMITIDOS = [
    "En Cuarentena",
    "En Observación",
    "En Refugio",
];
// --------------------------------------------------
// CREAR SOLICITUD DE CAMBIO DE ESTADO (FLUJO ANTIGUO)
// --------------------------------------------------

export async function crearSolicitudEstadoService(datos) {
    try {
        const solicitudRepository =
            AppDataSource.getRepository(SolicitudEstadoSchema);

        const mascotaRepository =
            AppDataSource.getRepository(MascotaSchema);

        const usuarioRepository =
            AppDataSource.getRepository(UsuarioSchema);

        const mascota = await mascotaRepository.findOneBy({
            mascota_id: datos.mascotaId,
        });

        if (!mascota) {
            return [null, "Mascota no encontrada"];
        }

        const solicitante = await usuarioRepository.findOneBy({
            usuarioId: datos.solicitanteId,
        });

        if (!solicitante || !solicitante.activo) {
            return [null, "El usuario solicitante no existe o está inactivo"];
        }

        if (mascota.mascota_estado === datos.estadoSolicitado) {
            return [null, "La mascota ya tiene ese estado"];
        }

        // Evitar solicitudes pendientes duplicadas para la misma mascota.
        const solicitudPendiente = await solicitudRepository.findOne({
            where: {
                mascota: { mascota_id: datos.mascotaId },
                estadoSolicitud: "PENDIENTE",
            },
        });

        if (solicitudPendiente) {
            return [
                null,
                "La mascota ya tiene una solicitud de estado pendiente",
            ];
        }

        const solicitud = solicitudRepository.create({
            estadoSolicitado: datos.estadoSolicitado,
            motivo: datos.motivo,
            estadoSolicitud: "PENDIENTE",
            mascota,
            solicitante,
        });

        const guardada = await solicitudRepository.save(solicitud);

        return [guardada, null];
    } catch (error) {
        console.error("Error al crear solicitud de estado:", error);
        return [null, "Error interno al crear la solicitud"];
    }
}

// --------------------------------------------------
// OBTENER SOLICITUDES (FLUJO ANTIGUO)
// --------------------------------------------------

export async function obtenerSolicitudesEstadoService(usuario) {
    try {
        const repository =
            AppDataSource.getRepository(SolicitudEstadoSchema);

        const opciones = {
            relations: {
                mascota: true,
                solicitante: true,
                revisor: true,
            },
            order: {
                fechaSolicitud: "DESC",
            },
        };

        // Los administradores activos pueden consultar todas.
        // Los demás usuarios autorizados solo ven las propias.
        if (usuario.rol !== "Admin") {
            opciones.where = {
                solicitante: {
                    usuarioId: usuario.usuarioId,
                },
            };
        }

        const solicitudes = await repository.find(opciones);

        // No devolver contraseñas ni datos innecesarios de los usuarios.
        const resultado = solicitudes.map((s) => ({
            solicitudEstadoId: s.solicitudEstadoId,
            estadoSolicitado: s.estadoSolicitado,
            motivo: s.motivo,
            estadoSolicitud: s.estadoSolicitud,
            fechaSolicitud: s.fechaSolicitud,
            fechaResolucion: s.fechaResolucion,
            comentarioResolucion: s.comentarioResolucion,
            mascota: s.mascota
                ? {
                    mascota_id: s.mascota.mascota_id,
                    mascota_nombreCompleto:
                        s.mascota.mascota_nombreCompleto,
                    mascota_estado: s.mascota.mascota_estado,
                }
                : null,
            solicitante: s.solicitante
                ? {
                    usuarioId: s.solicitante.usuarioId,
                    usuarioNombre: s.solicitante.usuarioNombre,
                }
                : null,
            revisor: s.revisor
                ? {
                    usuarioId: s.revisor.usuarioId,
                    usuarioNombre: s.revisor.usuarioNombre,
                }
                : null,
        }));

        return [resultado, null];
    } catch (error) {
        console.error("Error al consultar solicitudes de estado:", error);
        return [null, "Error interno al consultar las solicitudes"];
    }
}

// --------------------------------------------------
// RESOLVER SOLICITUD (FLUJO ANTIGUO)
// --------------------------------------------------

export async function resolverSolicitudEstadoService(datos) {
    try {
        const resultado = await AppDataSource.transaction(
            async (manager) => {
                const solicitudRepository =
                    manager.getRepository(SolicitudEstadoSchema);

                const mascotaRepository =
                    manager.getRepository(MascotaSchema);

                const usuarioRepository =
                    manager.getRepository(UsuarioSchema);

                const solicitud = await solicitudRepository.findOne({
                    where: {
                        solicitudEstadoId: datos.solicitudEstadoId,
                    },
                    relations: {
                        mascota: true,
                    },
                    lock: {
                        mode: "pessimistic_write",
                    },
                });

                if (!solicitud) {
                    throw new Error("SOLICITUD_NO_ENCONTRADA");
                }

                if (solicitud.estadoSolicitud !== "PENDIENTE") {
                    throw new Error("SOLICITUD_YA_RESUELTA");
                }

                const administrador = await usuarioRepository.findOneBy({
                    usuarioId: datos.revisorId,
                });

                if (
                    !administrador ||
                    !administrador.activo ||
                    administrador.rol !== "Admin"
                ) {
                    throw new Error("ADMINISTRADOR_NO_VALIDO");
                }

                if (datos.decision === "APROBADA") {
                    if (
                        !ESTADOS_SOLICITUD_PERMITIDOS.includes(
                            solicitud.estadoSolicitado
                        )
                    ) {
                        throw new Error("ESTADO_SOLICITADO_NO_VALIDO");
                    }

                    const mascota = await mascotaRepository.findOneBy({
                        mascota_id: solicitud.mascota.mascota_id,
                    });

                    if (!mascota) {
                        throw new Error("MASCOTA_NO_ENCONTRADA");
                    }

                    mascota.mascota_estado = solicitud.estadoSolicitado;

                    const mascotaActualizada =
                        await mascotaRepository.save(mascota);

                    solicitud.mascota = mascotaActualizada;
                }

                solicitud.estadoSolicitud = datos.decision;
                solicitud.fechaResolucion = new Date();
                solicitud.comentarioResolucion =
                    datos.comentarioResolucion || null;
                solicitud.revisor = administrador;

                return await solicitudRepository.save(solicitud);
            }
        );

        return [resultado, null];
    } catch (error) {
        const erroresConocidos = {
            SOLICITUD_NO_ENCONTRADA: "Solicitud no encontrada",
            SOLICITUD_YA_RESUELTA: "La solicitud ya fue resuelta",
            ADMINISTRADOR_NO_VALIDO:
                "El administrador no es válido o está inactivo",
            MASCOTA_NO_ENCONTRADA: "Mascota no encontrada",
            ESTADO_SOLICITADO_NO_VALIDO:
                "El estado solicitado no está permitido",
        };

        if (erroresConocidos[error.message]) {
            return [null, erroresConocidos[error.message]];
        }

        console.error("Error al resolver solicitud de estado:", error);
        return [null, "Error interno al resolver la solicitud"];
    }
}

// --------------------------------------------------
// CAMBIAR DIRECTAMENTE EL ESTADO SANITARIO
// NUEVO FLUJO PARA EL REQUERIMIENTO RF3
// --------------------------------------------------

export async function cambiarEstadoSanitarioMascotaService(datos) {
    try {
        const resultado = await AppDataSource.transaction(
            async (manager) => {
                const mascotaRepository =
                    manager.getRepository(MascotaSchema);

                const usuarioRepository =
                    manager.getRepository(UsuarioSchema);

                // Verificar que el usuario sea un veterinario activo.
                const veterinario = await usuarioRepository.findOneBy({
                    usuarioId: datos.veterinarioId,
                });

                if (
                    !veterinario ||
                    !veterinario.activo ||
                    veterinario.rol !== "Veterinario"
                ) {
                    throw new Error("VETERINARIO_NO_VALIDO");
                }

                // Validar el estado sanitario solicitado.
                if (!ESTADOS_SANITARIOS_PERMITIDOS.includes(datos.estado)) {
                    throw new Error("ESTADO_NO_VALIDO");
                }

                // Buscar la mascota.
                const mascota = await mascotaRepository.findOne({
                    where: {
                        mascota_id: datos.mascotaId,
                    },
                    lock: {
                        mode: "pessimistic_write",
                    },
                });

                if (!mascota) {
                    throw new Error("MASCOTA_NO_ENCONTRADA");
                }

                // Evitar guardar el mismo estado nuevamente.
                if (mascota.mascota_estado === datos.estado) {
                    throw new Error("ESTADO_YA_ASIGNADO");
                }

                // Actualizar el estado sanitario.
                mascota.mascota_estado = datos.estado;

                const mascotaActualizada =
                    await mascotaRepository.save(mascota);

                // Devolver solamente los datos necesarios.
                return {
                    mascota_id: mascotaActualizada.mascota_id,
                    mascota_nombreCompleto:
                        mascotaActualizada.mascota_nombreCompleto,
                    mascota_estado:
                        mascotaActualizada.mascota_estado,
                };
            }
        );

        return [resultado, null];

    } catch (error) {
        const erroresConocidos = {
            VETERINARIO_NO_VALIDO:
                "El usuario no es un veterinario válido o está inactivo",

            ESTADO_NO_VALIDO:
                "El estado sanitario solicitado no está permitido",

            MASCOTA_NO_ENCONTRADA:
                "Mascota no encontrada",

            ESTADO_YA_ASIGNADO:
                "La mascota ya tiene ese estado",
        };

        if (erroresConocidos[error.message]) {
            return [null, erroresConocidos[error.message]];
        }

        console.error(
            "Error al cambiar estado sanitario de mascota:",
            error
        );

        return [null, "Error interno al cambiar el estado sanitario"];
    }
}
