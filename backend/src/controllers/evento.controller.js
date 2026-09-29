import { 
    handleErrorClient, 
    handleErrorServer, 
    handleSuccess 
} from "../handlers/responseHandlers.js";

import { 
    crearEventoService, 
    obtenerEventosService, 
    actualizarEventoService, 
    eliminarEventoService,
    inscribirUsuarioService, 
    desinscribirUsuarioService,
    obtenerEventoPorIdService,
    obtenerMisInscripcionesService,
    obtenerInscritosPorEventoService,
    marcarAsistenciaService,
} from "../services/evento.service.js";

import { 
    eventoBodyValidation, 
    eventoUpdateValidation, 
    idValidation,
    eventoUsuarioIdValidation
} from "../validations/evento.validations.js";

export const crearEvento = async (req, res) => {
    try {
        const { error, value } = eventoBodyValidation.validate(req.body);
        if (error) {
            return handleErrorClient(res, 400, "Error de validación", error.details[0].message);
        }

        const datosEvento = value;
        const creadorId = req.user?.id || 1;

        const [resultado, error_servicio] = await crearEventoService(datosEvento, creadorId);

        if (error_servicio) {
            return handleErrorClient(res, 400, "No se pudo programar el evento", error_servicio);
        }

        return handleSuccess(res, 201, "Evento programado exitosamente", resultado);
    } catch (error) {
        console.error("Error en crearEvento controller:", error);
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
};

export const obtenerEventos = async (req, res) => {
    try {
        const categoria = req.query.categoria;

        const [eventos, error_servicio] = await obtenerEventosService(categoria);

        if (error_servicio) {
            return handleErrorClient(res, 400, "Error al consultar la cartelera de eventos", error_servicio);
        }

        return handleSuccess(res, 200, "Eventos obtenidos correctamente", eventos);
    } catch (error) {
        console.error("Error en obtenerEventos controller:", error);
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
};

export const actualizarEvento = async (req, res) => {
    try {
        const { error: errorId, value: valueId } = idValidation.validate(req.params);
        if (errorId) return handleErrorClient(res, 400, "URL inválida", errorId.details[0].message);

        const { error, value: datosActualizados } = eventoUpdateValidation.validate(req.body);
        if (error) return handleErrorClient(res, 400, "Error de validación", error.details[0].message);

        if (Object.keys(datosActualizados).length === 0) {
            return handleErrorClient(res, 400, "No se enviaron datos para actualizar");
        }

        const eventoId = valueId.id;
        const usuarioId = req.user?.id || 1; 

        const [resultado, error_servicio] = await actualizarEventoService(eventoId, datosActualizados, usuarioId);

        if (error_servicio) return handleErrorClient(res, 400, "No se pudo actualizar el evento", error_servicio);

        return handleSuccess(res, 200, "Evento actualizado correctamente", resultado);
    } catch (error) {
        console.error("Error en actualizarEvento controller:", error);
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
};

export const eliminarEvento = async (req, res) => {
    try {
        const { error, value } = idValidation.validate(req.params);
        if (error) return handleErrorClient(res, 400, "URL inválida", error.details[0].message);

        const eventoId = value.id;
        const usuarioId = req.user?.id || 1; 

        const [resultado, error_servicio] = await eliminarEventoService(eventoId, usuarioId);

        if (error_servicio) return handleErrorClient(res, 400, "No se pudo eliminar el evento", error_servicio);

        return handleSuccess(res, 200, "Evento eliminado correctamente", resultado);
    } catch (error) {
        console.error("Error en eliminarEvento controller:", error);
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
};

export const inscribirAEvento = async (req, res) => {
    try {
        const { error, value } = idValidation.validate(req.params);
        
        if (error) {
            return handleErrorClient(res, 400, "URL inválida", error.details[0].message);
        }

        const eventoId = value.id;

        // inyeccion temporal del id 2
        const usuarioId = req.user?.id || 2; 

        const [resultado, error_servicio] = await inscribirUsuarioService(eventoId, usuarioId);

        if (error_servicio) {
            return handleErrorClient(res, 400, "No se pudo realizar la inscripción", error_servicio);
        }

        return handleSuccess(res, 201, "te has inscrito al evento exitosamente", resultado);
    } catch (error) {
        console.error("error en inscribiraevento controller:", error);
        return handleErrorServer(res, 500, "error interno del servidor", error.message);
    }
};

export const cancelarInscripcion = async (req, res) => {
    try {
        const { error, value } = idValidation.validate(req.params);
        
        if (error) {
            return handleErrorClient(res, 400, "url invalida", error.details[0].message);
        }

        const eventoId = value.id;

        // inyeccion temporal del id 2
        const usuarioId = req.user?.id || 2; 

        const [resultado, error_servicio] = await desinscribirUsuarioService(eventoId, usuarioId);

        if (error_servicio) {
            return handleErrorClient(res, 400, "no se pudo cancelar la inscripcion", error_servicio);
        }

        return handleSuccess(res, 200, "tu inscripcion ha sido cancelada", resultado);
    } catch (error) {
        console.error("error en cancelarinscripcion controller:", error);
        return handleErrorServer(res, 500, "error interno del servidor", error.message);
    }
};

export const obtenerEventoPorId = async (req, res) => {
    try {
        const { error, value } = idValidation.validate(req.params);
        if (error) return handleErrorClient(res, 400, "URL inválida", error.details[0].message);

        const [resultado, error_servicio] = await obtenerEventoPorIdService(value.id);
        if (error_servicio) return handleErrorClient(res, 400, "No se pudo obtener el evento", error_servicio);

        return handleSuccess(res, 200, "Evento encontrado", resultado);
    } catch (error) {
        console.error("error en obtenereventoporid controller:", error);
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
};

export const obtenerMisInscripciones = async (req, res) => {
    try {
        // inyeccion temporal del id 2
        const usuarioId = req.user?.id || 2; 

        const [resultado, error_servicio] = await obtenerMisInscripcionesService(usuarioId);
        if (error_servicio) return handleErrorClient(res, 400, "Error al buscar inscripciones", error_servicio);

        return handleSuccess(res, 200, "Inscripciones obtenidas", resultado);
    } catch (error) {
        console.error("error en obtenermisinscripciones controller:", error);
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
};

export const obtenerInscritosEvento = async (req, res) => {
    try {
        const { error, value } = idValidation.validate(req.params);
        if (error) return handleErrorClient(res, 400, "URL inválida", error.details[0].message);

        const eventoId = value.id;

        // inyeccion temporal del id 1 (admin) o 3 (organizador)
        const solicitanteId = req.user?.id || 1; 

        const [resultado, error_servicio] = await obtenerInscritosPorEventoService(eventoId, solicitanteId);
        if (error_servicio) return handleErrorClient(res, 400, "Acceso denegado", error_servicio);

        return handleSuccess(res, 200, "Lista de asistentes obtenida", resultado);
    } catch (error) {
        console.error("error en obtenerinscritosevento controller:", error);
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
};

export const marcarAsistencia = async (req, res) => {
    try {
        const { error, value } = eventoUsuarioIdValidation.validate(req.params);
        if (error) return handleErrorClient(res, 400, "URL inválida", error.details[0].message);

        const { eventoId, usuarioId } = value;

        // inyeccion temporal del id 1 
        const solicitanteId = req.user?.id || 1; 

        const [resultado, error_servicio] = await marcarAsistenciaService(eventoId, usuarioId, solicitanteId);
        if (error_servicio) return handleErrorClient(res, 400, "No se pudo marcar la asistencia", error_servicio);

        return handleSuccess(res, 200, "Asistencia registrada correctamente", resultado);
    } catch (error) {
        console.error("error en marcarasistencia controller:", error);
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
};