import { AppDataSource } from "../config/configDb.js";
import EventoSchema from "../entity/evento.entity.js";
import UsuarioSchema from "../entity/usuario.entity.js";
import InscripcionSchema from "../entity/inscripcion.entity.js";
import { MoreThanOrEqual } from "typeorm";

export const crearEventoService = async (datosEvento, creadorId) => {
    try {
        const { titulo, descripcion, categoria, fechaEvento, horaInicio, lugar, organizadorId } = datosEvento;

        const eventoRepository = AppDataSource.getRepository(EventoSchema);
        const usuarioRepository = AppDataSource.getRepository(UsuarioSchema);

        const admin = await usuarioRepository.findOne({
            where: { usuarioId: creadorId, rol: "Admin", activo: true }
        });

        if (!admin) {
            return [null, "solo los administradores pueden crear eventos."];
        }

        const organizador = await usuarioRepository.findOne({
            where: { usuarioId: organizadorId, rol: "Voluntario", activo: true }
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
            lugar,
            estado: "Programado",
            organizador: { usuarioId: organizadorId }
        });

        const eventoGuardado = await eventoRepository.save(nuevoEvento);
        return [eventoGuardado, null];
    } catch (error) {
        console.error("Error en crearEventoService:", error);
        return [null, "Error interno al guardar el evento en la base de datos."];
    }
};

export const obtenerEventosService = async (filtroCategoria = null) => {
    try {
        const eventoRepository = AppDataSource.getRepository(EventoSchema);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const condiciones = {
            fechaEvento: MoreThanOrEqual(hoy)
        };

        if (filtroCategoria && filtroCategoria !== 'todos') {
            condiciones.categoria = filtroCategoria;
        }

        const eventos = await eventoRepository.find({
            where: condiciones,
            order: { fechaEvento: "ASC" },
            relations:{ "organizador": true }
        });

        return [eventos, null];
    } catch (error) {
        console.error("Error en obtenerEventosService:", error);
        return [null, "Error interno al obtener los eventos."];
    }
};

export const actualizarEventoService = async (eventoId, datosActualizados, usuarioId) => {
    try{
        const eventoRepository = AppDataSource.getRepository(EventoSchema);
        const usuarioRepository = AppDataSource.getRepository(UsuarioSchema);

        const usuario = await usuarioRepository.findOne({ where: { usuarioId } });
        if (!usuario || !usuario.activo) return [null, "Usuario inválido."];

        const evento = await eventoRepository.findOne({ 
            where: { eventoId },
            relations: { organizador: true } 
        });
        if(!evento) return [null, "El evento no existe."];

        if(usuario.rol !== "Admin" && evento.organizador.usuarioId !== usuarioId) {
            return [null, "No tienes permisos para modificar este evento."];
        }

        if(datosActualizados.organizadorId) {
            if(!esAdmin) return [null, "Solo un administrador puede reasignar el organizador del evento."];
            
            // validar que el nuevo organizador sea voluntario
            const nuevoOrganizador = await usuarioRepository.findOne({ 
                where: { usuarioId: datosActualizados.organizadorId, rol: "Voluntario", activo: true } 
            });
            
            if(!nuevoOrganizador) return [null, "El nuevo organizador asignado no es un voluntario activo."];
            
            datosActualizados.organizador = { usuarioId: datosActualizados.organizadorId };
            delete datosActualizados.organizadorId;
        }

        const eventoActualizado = eventoRepository.merge(evento, datosActualizados);
        
        await eventoRepository.save(eventoActualizado);
        return [eventoActualizado, null];
    }catch (error) {
        console.error("Error en actualizareventoservice:", error);
        return [null, "Error interno al actualizar el evento."];
    }
};

export const eliminarEventoService = async (eventoId, usuarioId) => {
    try {
        const eventoRepository = AppDataSource.getRepository(EventoSchema);
        const usuarioRepository = AppDataSource.getRepository(UsuarioSchema);
        const inscripcionRepository = AppDataSource.getRepository(InscripcionSchema);

        const usuario = await usuarioRepository.findOne({ where: { usuarioId } });
        if (!usuario || !usuario.activo || usuario.rol !== "Admin") {
            return [null, "Solo los administradores pueden eliminar eventos de forma definitiva."];
        }

        const evento = await eventoRepository.findOne({ where: { eventoId } });
        if (!evento) return [null, "El evento no existe."];

        await inscripcionRepository.delete({ evento: { eventoId } });
        await eventoRepository.remove(evento);
        
        return [true, null];
    } catch (error) {
        console.error("Error en eliminareventoservice:", error);
        return [null, "Error interno al eliminar el evento."];
    }
};

export const inscribirUsuarioService = async (eventoId, usuarioId) => {
    try {
        const eventoRepository = AppDataSource.getRepository(EventoSchema);
        const inscripcionRepository = AppDataSource.getRepository(InscripcionSchema);

        const evento = await eventoRepository.findOne({ where: { eventoId } });
        if (!evento) return [null, "El evento no existe."];
        if (evento.estado !== "Programado") return [null, "El evento ya no está disponible para inscripciones."];

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        if (new Date(evento.fechaEvento) < hoy) return [null, "No puedes inscribirte a un evento que ya pasó."];

        const inscripcionPrevia = await inscripcionRepository.findOne({
            where: { evento: { eventoId }, usuario: { usuarioId } }
        });
        if (inscripcionPrevia) return [null, "Ya te encuentras inscrito en este evento."];

        const nuevaInscripcion = inscripcionRepository.create({
            evento: { eventoId },
            usuario: { usuarioId }
        });

        await inscripcionRepository.save(nuevaInscripcion);
        return [true, null];

    } catch (error) {
        console.error("Error en inscribirUsuarioService:", error);
        return [null, "Error interno al procesar la inscripción."];
    }
};

export const desinscribirUsuarioService = async (eventoId, usuarioId) => {
    try {
        const inscripcionRepository = AppDataSource.getRepository(InscripcionSchema);

        const inscripcion = await inscripcionRepository.findOne({
            where: { evento: { eventoId }, usuario: { usuarioId } }
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
            where: { eventoId },
            relations: { organizador: true }
        });

        if (!evento) return [null, "El evento no existe."];
        return [evento, null];
    } catch (error) {
        console.error("error en obtenereventoporidservice:", error);
        return [null, "Error interno al obtener el evento."];
    }
};

export const obtenerMisInscripcionesService = async (usuarioId) => {
    try {
        const inscripcionRepository = AppDataSource.getRepository(InscripcionSchema);
        // buscamos todas las inscripciones de este usuario y traemos los datos del evento
        const inscripciones = await inscripcionRepository.find({
            where: { usuario: { usuarioId } },
            relations: { evento: true }
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

        const evento = await eventoRepository.findOne({ where: { eventoId }, relations: { organizador: true } });
        if (!evento) return [null, "El evento no existe."];

        const usuario = await usuarioRepository.findOne({ where: { usuarioId: usuarioSolicitanteId } });
        
        // regla de seguridad: solo admin o el organizador a cargo pueden ver la lista
        const esAdmin = usuario?.rol === "Admin";
        const esOrganizador = evento.organizador.usuarioId === usuarioSolicitanteId;

        if (!esAdmin && !esOrganizador) {
            return [null, "No tienes permisos para ver la lista de asistentes de este evento."];
        }

        const inscritos = await inscripcionRepository.find({
            where: { evento: { eventoId } },
            relations: { usuario: true }
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

        const evento = await eventoRepository.findOne({ where: { eventoId }, relations: { organizador: true } });
        if (!evento) return [null, "El evento no existe."];

        const usuario = await usuarioRepository.findOne({ where: { usuarioId: usuarioSolicitanteId } });
        
        if (usuario?.rol !== "Admin" && evento.organizador.usuarioId !== usuarioSolicitanteId) {
            return [null, "No tienes permisos para pasar lista en este evento."];
        }

        const inscripcion = await inscripcionRepository.findOne({
            where: { evento: { eventoId }, usuario: { usuarioId } }
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