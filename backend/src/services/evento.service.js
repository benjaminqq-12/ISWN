import { AppDataSource } from "../config/configDb.js";
import EventoSchema from "../entity/evento.entity.js";
import UsuarioSchema from "../entity/usuario.entity.js";
import InscripcionSchema from "../entity/inscripcion.entity.js";
import { In, MoreThanOrEqual, Not } from "typeorm";
import { fechaActual, validarHorarioEvento, eventoTermino } from "../helpers/evento.helper.js";
import { eventoBodyValidation } from "../validations/evento.validations.js";

export const crearEventoService = async (datosEvento, creadorId) => {
    try {
        return await AppDataSource.transaction(async manager => {
            await manager.query("SELECT pg_advisory_xact_lock(1001)");
            const { titulo, descripcion, categoria, fechaEvento, horaInicio, horaFin, capacidadMaxima, lugar, organizadorId } = datosEvento;

            const eventoRepository = manager.getRepository(EventoSchema);
            const usuarioRepository = manager.getRepository(UsuarioSchema);

            const admin = await usuarioRepository.findOne({
                where: { 
                    usuarioId: creadorId, 
                    rol: "Admin", 
                    activo: true 
                }
            });

            if (!admin) {
                return [null, "solo los administradores pueden crear eventos."];
            }

            const errorHorario = validarHorarioEvento(datosEvento);
            if (errorHorario) return [null, errorHorario];
            const conflicto = await validarSuperposicion(eventoRepository, datosEvento);
            if (conflicto) return [null, conflicto];

            const organizador = await usuarioRepository.findOne({
                where: { 
                    usuarioId: organizadorId, 
                    rol: "Voluntario", 
                    activo: true 
                }
            });

            if (!organizador) {
                return [null, "El organizador asignado no existe o no es un voluntario activo."];
            }

            const nuevoEvento = eventoRepository.create({
                titulo,
                descripcion,
                categoria,
                fechaEvento,
                horaInicio,
                horaFin,
                capacidadMaxima,
                lugar,
                estado: "Activo",
                organizador: { usuarioId: organizadorId }
            });

            const eventoGuardado = await eventoRepository.save(nuevoEvento);
            return [eventoGuardado, null];
        });
    } catch (error) {
        console.error("Error en crearEventoService:", error);
        return [null, "Error interno al guardar el evento en la base de datos."];
    }
};

export const obtenerEventosService = async (filtroCategoria = null) => {
    try {
        const eventoRepository = AppDataSource.getRepository(EventoSchema);
        const hoy = fechaActual();

        const condiciones = {
            fechaEvento: MoreThanOrEqual(hoy),
            estado: In(["Activo", "Programado"])
        };

        if (filtroCategoria && filtroCategoria !== 'todos') {
            condiciones.categoria = filtroCategoria;
        }

        const eventos = await eventoRepository.find({
            where: condiciones,
            order: { fechaEvento: "ASC", horaInicio: "ASC" },
            relations:{ "organizador": true }
        });

        return [await agregarCupos(eventos), null];
    } catch (error) {
        console.error("Error en obtenerEventosService:", error);
        return [null, "Error interno al obtener los eventos."];
    }
};

export const actualizarEventoService = async (eventoId, datosActualizados, usuarioId) => {
    try {
        return await AppDataSource.transaction(async manager => {
            await manager.query("SELECT pg_advisory_xact_lock(1001)");
            const eventoRepository = manager.getRepository(EventoSchema);
            const usuarioRepository = manager.getRepository(UsuarioSchema);

            const usuario = await usuarioRepository.findOne({ where: { usuarioId } });
            if (!usuario || !usuario.activo) return [null, "Usuario inválido."];

            const existe = await eventoRepository.findOne({ 
                where: { eventoId }, 
                lock: { mode: "pessimistic_write" } 
            });

            if (!existe) return [null, "El evento no existe."];
            const evento = await eventoRepository.findOne({
                where: { eventoId },
                relations: { organizador: true }
            });

            if(!evento) return [null, "El evento no existe."];

            const esAdmin = usuario.rol === "Admin";
            if(!esAdmin && evento.organizador?.usuarioId !== usuarioId) {
                return [null, "No tienes permisos para modificar este evento."];
            }

            if (evento.estado === "Borrador") return [null, "Usa Guardar borrador o Publicar evento para esta actividad."];
            if (evento.estado === "Finalizado") return [null, "Los eventos finalizados no se pueden modificar."];
            if (datosActualizados.estado === "Finalizado") return [null, "Usa la acción Finalizar evento."];

            if(datosActualizados.organizadorId) {
                if(!esAdmin) return [null, "Solo un administrador puede reasignar el organizador del evento."];

                const nuevoOrganizador = await usuarioRepository.findOne({
                    where: { 
                        usuarioId: datosActualizados.organizadorId, 
                        rol: "Voluntario", activo: true 
                    }
                });

                if(!nuevoOrganizador) return [null, "El nuevo organizador asignado no es un voluntario activo."];

                datosActualizados.organizador = { usuarioId: datosActualizados.organizadorId };
                delete datosActualizados.organizadorId;
            }

            const eventoActualizado = eventoRepository.merge(evento, datosActualizados);

            if (["Activo", "Programado"].includes(eventoActualizado.estado)) {
                const errorHorario = validarHorarioEvento(eventoActualizado);

                if (errorHorario) return [null, errorHorario];
                if (!eventoActualizado.capacidadMaxima) return [null, "Debes indicar la capacidad máxima del evento."];

                const conflicto = await validarSuperposicion(eventoRepository, eventoActualizado, eventoId);

                if (conflicto) return [null, conflicto];
                eventoActualizado.estado = "Activo";
            }
            const totalInscritos = await manager.getRepository(InscripcionSchema).count({ 
                where: { evento: { eventoId } } 
            });

            if (eventoActualizado.capacidadMaxima !== null && eventoActualizado.capacidadMaxima < totalInscritos) {
                return [null, "La capacidad no puede ser menor que la cantidad de personas inscritas."];
            }
            await eventoRepository.save(eventoActualizado);
            if (eventoActualizado.organizador) {
                eventoActualizado.organizador = { usuarioId: eventoActualizado.organizador.usuarioId, usuarioNombre: eventoActualizado.organizador.usuarioNombre };
            }
            return [eventoActualizado, null];
        });
    }catch (error) {
        console.error("Error en actualizareventoservice:", error);
        return [null, "Error interno al actualizar el evento."];
    }
};

export const eliminarEventoService = async (eventoId, usuarioId) => {
    try {
        return await AppDataSource.transaction(async manager => {
            const eventoRepository = manager.getRepository(EventoSchema);
            const usuarioRepository = manager.getRepository(UsuarioSchema);
            const inscripcionRepository = manager.getRepository(InscripcionSchema);

            const usuario = await usuarioRepository.findOne({ where: { usuarioId } });
            if (!usuario || !usuario.activo || usuario.rol !== "Admin") {
                return [null, "Solo los administradores pueden eliminar eventos de forma definitiva."];
            }

            const evento = await eventoRepository.findOne({ 
                where: { eventoId }, 
                lock: { mode: "pessimistic_write" } 
            });

            if (!evento) return [null, "El evento no existe."];

            await inscripcionRepository.delete({ evento: { eventoId } });
            await eventoRepository.remove(evento);

            return [true, null];
        });
    } catch (error) {
        console.error("Error en eliminareventoservice:", error);
        return [null, "Error interno al eliminar el evento."];
    }
};

export const inscribirUsuarioService = async (eventoId, usuarioId) => {
    try {
        return await AppDataSource.transaction(async manager => {
            const eventoRepository = manager.getRepository(EventoSchema);
            const inscripcionRepository = manager.getRepository(InscripcionSchema);

            const usuario = await manager.getRepository(UsuarioSchema).findOne({ 
                where: { usuarioId, activo: true } 
            });

            if (!usuario) return [null, "Debes iniciar sesión con una cuenta activa para inscribirte."];

            const evento = await eventoRepository.findOne({ 
                where: { eventoId }, 
                lock: { mode: "pessimistic_write" } 
            });

            if (!evento) return [null, "El evento no existe."];
            if (!["Activo", "Programado"].includes(evento.estado)) return [null, "El evento ya no está disponible para inscripciones."];

            const hoy = fechaActual();
            if (evento.fechaEvento < hoy) return [null, "No puedes inscribirte a un evento que ya pasó."];

            const inscripcionPrevia = await inscripcionRepository.findOne({
                where: { 
                    evento: { eventoId }, 
                    usuario: { usuarioId } 
                }
            });

            if (inscripcionPrevia) return [null, "Ya te encuentras inscrito en este evento."];

            if (!evento.capacidadMaxima || !evento.horaFin) return [null, "El administrador debe completar los datos del evento."];
            const totalInscritos = await inscripcionRepository.count({ 
                where: { evento: { eventoId } } 
            });

            if (totalInscritos >= evento.capacidadMaxima) return [null, "El evento ya alcanzó su capacidad máxima de asistentes."];

            const nuevaInscripcion = inscripcionRepository.create({
                evento: { eventoId },
                usuario: { usuarioId }
            });

            await inscripcionRepository.save(nuevaInscripcion);
            return [true, null];

        });
    } catch (error) {
        console.error("Error en inscribirUsuarioService:", error);
        return [null, "Error interno al procesar la inscripción."];
    }
};

export const desinscribirUsuarioService = async (eventoId, usuarioId) => {
    try {
        const inscripcionRepository = AppDataSource.getRepository(InscripcionSchema);

        const inscripcion = await inscripcionRepository.findOne({
            where: { 
                evento: { eventoId }, 
                usuario: { usuarioId } 
            }
        });

        if (!inscripcion) return [null, "No estás inscrito en este evento."];

        await inscripcionRepository.remove(inscripcion);
        return [true, null];

    } catch (error) {
        console.error("Error en desinscribirUsuarioService:", error);
        return [null, "Error interno al cancelar la inscripción."];
    }
};

export const obtenerEventoPorIdService = async (eventoId) => {
    try {
        const eventoRepository = AppDataSource.getRepository(EventoSchema);
        const evento = await eventoRepository.findOne({
            where: { 
                eventoId, 
                estado: Not("Borrador") 
            },
            relations: { organizador: true }
        });

        if (!evento) return [null, "El evento no existe."];
        const [eventoConCupos] = await agregarCupos([evento]);
        return [eventoConCupos, null];
    } catch (error) {
        console.error("error en obtenereventoporidservice:", error);
        return [null, "Error interno al obtener el evento."];
    }
};

export const obtenerMisInscripcionesService = async (usuarioId) => {
    try {
        const inscripcionRepository = AppDataSource.getRepository(InscripcionSchema);
        const inscripciones = await inscripcionRepository.find({
            where: { usuario: { usuarioId } },
            relations: { evento: true },
            order: { evento: { 
                fechaEvento: "ASC", 
                horaInicio: "ASC" 
            }}
        });

        return [inscripciones, null];
    } catch (error) {
        console.error("error en obtenermisinscripcionesservice:", error);
        return [null, "Error interno al obtener tus inscripciones."];
    }
};

export const obtenerInscritosPorEventoService = async (eventoId, usuarioSolicitanteId) => {
    try {
        const eventoRepository = AppDataSource.getRepository(EventoSchema);
        const usuarioRepository = AppDataSource.getRepository(UsuarioSchema);
        const inscripcionRepository = AppDataSource.getRepository(InscripcionSchema);

        const evento = await eventoRepository.findOne({ 
            where: { eventoId }, 
            relations: { organizador: true } 
        });
        if (!evento) return [null, "El evento no existe."];

        const usuario = await usuarioRepository.findOne({ 
            where: { 
                usuarioId: usuarioSolicitanteId 
            }
        });

        if (!usuario || !usuario.activo) return [null, "Usuario inválido."];

        const esAdmin = usuario?.rol === "Admin";
        const esOrganizador = evento.organizador?.usuarioId === usuarioSolicitanteId;

        if (!esAdmin && !esOrganizador) {
            return [null, "No tienes permisos para ver la lista de asistentes de este evento."];
        }

        const inscritos = await inscripcionRepository.find({
            where: { evento: { eventoId } },
            relations: { usuario: true },
            select: {
                inscripcionId: true, 
                fechaInscripcion: true, 
                asistenciaConfirmada: true,
                usuario: { 
                    usuarioId: true, 
                    usuarioNombre: true 
                }
            }
        });

        return [inscritos, null];
    } catch (error) {
        console.error("error en obtenerinscritosoporeventoservice:", error);
        return [null, "Error interno al obtener la lista de inscritos."];
    }
};

export const marcarAsistenciaService = async (eventoId, usuarioId, usuarioSolicitanteId) => {
    try {
        const eventoRepository = AppDataSource.getRepository(EventoSchema);
        const usuarioRepository = AppDataSource.getRepository(UsuarioSchema);
        const inscripcionRepository = AppDataSource.getRepository(InscripcionSchema);

        const evento = await eventoRepository.findOne({ 
            where: { eventoId }, 
            relations: { organizador: true } 
        });

        if (!evento) return [null, "El evento no existe."];
        const usuario = await usuarioRepository.findOne({ where: { usuarioId: usuarioSolicitanteId } });

        if (!usuario?.activo || (usuario.rol !== "Admin" && evento.organizador?.usuarioId !== usuarioSolicitanteId)) {
            return [null, "No tienes permisos para pasar lista en este evento."];
        }

        const inscripcion = await inscripcionRepository.findOne({
            where: { 
                evento: { eventoId }, 
                usuario: { usuarioId } 
            }
        });

        if (!inscripcion) return [null, "El usuario no está inscrito en este evento."];
        if (inscripcion.asistenciaConfirmada) return [null, "El usuario ya tiene su asistencia confirmada."];

        inscripcion.asistenciaConfirmada = true;
        await inscripcionRepository.save(inscripcion);

        return [inscripcion, null];
    } catch (error) {
        console.error("error en marcarasistenciaservice:", error);
        return [null, "Error interno al registrar la asistencia."];
    }
};

async function agregarCupos(eventos) {
    const inscripcionRepository = AppDataSource.getRepository(InscripcionSchema);

    for (const evento of eventos) {
        evento.totalInscritos = await inscripcionRepository.count({ 
            where: { 
                evento: { eventoId: evento.eventoId } 
            } 
        });
        evento.cuposDisponibles = evento.capacidadMaxima === null ? null : Math.max(0, evento.capacidadMaxima - evento.totalInscritos);
        if (evento.organizador) {
            evento.organizador = { 
                usuarioId: evento.organizador.usuarioId, 
                usuarioNombre: evento.organizador.usuarioNombre 
            };
        }
    }

    return eventos;
}

async function validarSuperposicion(eventoRepository, datos, eventoId = null) {
    const eventos = await eventoRepository.find({
        where: { 
            fechaEvento: datos.fechaEvento, 
            estado: In(["Activo", "Programado"]) 
        }
    });

    for (const evento of eventos) {
        if (evento.eventoId === eventoId) continue;
        if (evento.horaInicio < datos.horaFin && (!evento.horaFin || evento.horaFin > datos.horaInicio)) {
            return `El horario se superpone con "${evento.titulo}". Revisa las horas de inicio y término.`;
        }
    }

    return null;
}

export const obtenerOrganizadoresService = async () => {
    try {
        const usuarioRepository = AppDataSource.getRepository(UsuarioSchema);
        const organizadores = await usuarioRepository.find({
            where: { rol: "Voluntario", activo: true },
            select: { usuarioId: true, usuarioNombre: true },
            order: { usuarioNombre: "ASC" }
        });

        return [organizadores, null];
    } catch (error) {
        console.error("Error en obtenerOrganizadoresService:", error);
        return [null, "No se pudieron obtener los organizadores."];
    }
};

export const obtenerEventosGestionService = async (usuario) => {
    try {
        const eventoRepository = AppDataSource.getRepository(EventoSchema);
        const condiciones = usuario.rol === "Admin" ? {} : {
            organizador: { usuarioId: usuario.usuarioId }, 
            estado: Not("Borrador")
        };

        const eventos = await eventoRepository.find({
            where: condiciones, 
            relations: { organizador: true },
            order: { fechaEvento: "ASC", horaInicio: "ASC" }
        });

        for (const evento of eventos) {
            evento.puedeFinalizar = ["Activo", "Programado"].includes(evento.estado) && eventoTermino(evento);
            evento.puedeEditar = evento.estado === "Borrador" || (["Activo", "Programado"].includes(evento.estado) && evento.fechaEvento >= fechaActual());
        }

        return [await agregarCupos(eventos), null];
    } catch (error) {
        console.error("Error en obtenerEventosGestionService:", error);
        return [null, "Error interno al obtener los eventos de gestión."];
    }
};

export const guardarBorradorEventoService = async (eventoId, datos, usuarioId, publicar = false) => {
    try {
        return await AppDataSource.transaction(async manager => {
            await manager.query("SELECT pg_advisory_xact_lock(1001)");
            const eventoRepository = manager.getRepository(EventoSchema);
            const usuarioRepository = manager.getRepository(UsuarioSchema);

            const admin = await usuarioRepository.findOne({ 
                where: { 
                    usuarioId, 
                    rol: "Admin", 
                    activo: true 
                } 
            });

            if (!admin) return [null, "Solo el administrador puede guardar o publicar borradores."];

            let evento = eventoId ? await eventoRepository.findOne({ 
                where: { eventoId }, 
                lock: { mode: "pessimistic_write" } 
            }) : null;

            if (eventoId && (!evento || evento.estado !== "Borrador")) return [null, "El borrador no existe o ya fue publicado."];
            if (evento && datos.version !== evento.version) return [null, "El borrador cambió. Ábrelo nuevamente antes de guardar."];

            const { organizadorId, version, ...campos } = datos;
            if (publicar) {
                const { error } = eventoBodyValidation.validate({ 
                    ...campos, 
                    organizadorId 
                });

                if (error) return [null, error.details[0].message];
                const errorHorario = validarHorarioEvento(campos);

                if (errorHorario) return [null, errorHorario];
                const conflicto = await validarSuperposicion(eventoRepository, campos, eventoId);
                if (conflicto) return [null, conflicto];
            }
            if (organizadorId) {
                const organizador = await usuarioRepository.findOne({ 
                    where: { 
                        usuarioId: organizadorId, 
                        rol: "Voluntario", activo: true 
                    } 
                });
                if (!organizador) return [null, "Selecciona un organizador que sea voluntario activo."];
            }
            evento = eventoRepository.merge(evento || eventoRepository.create(), campos, {
                organizador: organizadorId ? { usuarioId: organizadorId } : null,
                estado: publicar ? "Activo" : "Borrador", 
                version: evento ? evento.version + 1 : 1
            });
            return [await eventoRepository.save(evento), null];
        });
    } catch (error) {
        console.error("Error en guardarBorradorEventoService:", error);
        return [null, "No se pudo guardar el borrador."];
    }
};