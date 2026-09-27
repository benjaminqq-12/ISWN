import { AppDataSource } from "../config/configDb.js";
import EventoSchema from "../entity/evento.entity.js";
import UsuarioSchema from "../entity/usuario.entity.js";
import InscripcionSchema from "../entity/inscripcion.entity.js";
import { MoreThanOrEqual } from "typeorm";

export const crearEventoService = async (datosEvento, creadorId) => {
    try {
        const { titulo, descripcion, fechaEvento, horaInicio, lugar, organizadorId } = datosEvento;

        const eventoRepository = AppDataSource.getRepository(EventoSchema);
        const usuarioRepository = AppDataSource.getRepository(UsuarioSchema);

        const admin = await usuarioRepository.findOne({
            where: { usuarioId: creadorId, rol: "Administrador", activo: true }
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

export const obtenerEventosService = async () => {
    try {
        const eventoRepository = AppDataSource.getRepository(EventoSchema);
        
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const eventos = await eventoRepository.find({
            where: {
                fechaEvento: MoreThanOrEqual(hoy)
            },
            order: {
                fechaEvento: "ASC" 
            },
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

        if(usuario.rol !== "Administrador" && evento.organizador.usuarioId !== usuarioId) {
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
        if (!usuario || !usuario.activo || usuario.rol !== "Administrador") {
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