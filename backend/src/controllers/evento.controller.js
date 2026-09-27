import { 
    handleErrorClient, 
    handleErrorServer, 
    handleSuccess 
} from "../handlers/responseHandlers.js";

import { 
    crearEventoService, 
    obtenerEventosService, 
    inscribirUsuarioService, 
    desinscribirUsuarioService 
} from "../services/evento.service.js";

import { eventoBodyValidation } from "../validations/evento.validations.js";

import { idValidation } from "../validations/evento.validations.js";

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
        const [eventos, error_servicio] = await obtenerEventosService();

        if (error_servicio) {
            return handleErrorClient(res, 400, "Error al consultar la cartelera de eventos", error_servicio);
        }

        return handleSuccess(res, 200, "Eventos obtenidos correctamente", eventos);
    } catch (error) {
        console.error("Error en obtenerEventos controller:", error);
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