import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";
import {
    procesarDonacionService,
    confirmarDonacionService,
    eliminarDonacionPendienteService,
    obtenerAnimalesApadrinablesService,
    obtenerEstadoAporteService,
    obtenerRecaudacionService,
    exportarRecaudacionService,
    desactivarSuscripcionService,
} from "../services/donacion.service.js";
import {
    donacionBodyValidation,
    filtroRecaudacionValidation,
    desactivarValidation,
    idValidation,
} from "../validations/donacion.validations.js";

export const obtenerConfiguracionDonaciones = (req, res) => {
    return handleSuccess(res, 200, "Disponibilidad de pagos", {
        habilitado: true,
        pruebas: false,
    });
};

export const obtenerAnimalesApadrinables = async (req, res) => {
    try {
        const [animales, error_servicio] = await obtenerAnimalesApadrinablesService();
        if (error_servicio) return handleErrorServer(res, 500, error_servicio);

        return handleSuccess(res, 200, "Animales en refugio", animales);
    } catch (error) {
        console.error("Error en obtenerAnimalesApadrinables controller:", error);
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
};

export const crearDonacion = async (req, res) => {
    try {
        const { error, value } = donacionBodyValidation.validate(req.body);
        if (error) {
            return handleErrorClient(res, 400, "Error en los datos de la donación", error.details[0].message);
        }

        const datosDonacion = value;
        const usuarioId = req.user.usuarioId;

        const [resultado, error_servicio] = await procesarDonacionService(datosDonacion, usuarioId);

        if (error_servicio) {
            return handleErrorClient(res, 400, "No se pudo registrar la donación", error_servicio);
        }

        return handleSuccess(res, 201, "Solicitud de donación registrada exitosamente", resultado);
    } catch (error) {
        console.error("Error en crearDonacion controller:", error);
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
};

export const confirmarDonacion = async (req, res) => {
    try {
        const { error, value } = idValidation.validate(req.params);
        if (error) return handleErrorClient(res, 400, "URL inválida", error.details[0].message);

        const donacionId = value.id;
        const [resultado, error_servicio] = await confirmarDonacionService(donacionId);

        if (error_servicio) {
            return handleErrorClient(res, 400, "No se pudo confirmar la donación", error_servicio);
        }

        return handleSuccess(res, 200, "Donación marcada como completada exitosamente", resultado);
    } catch (error) {
        console.error("Error en confirmarDonacion controller:", error);
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
};

export const eliminarDonacionPendiente = async (req, res) => {
    try {
        const { error, value } = idValidation.validate(req.params);
        if (error) return handleErrorClient(res, 400, "URL inválida", error.details[0].message);

        const donacionId = value.id;
        const [resultado, error_servicio] = await eliminarDonacionPendienteService(donacionId);

        if (error_servicio) {
            return handleErrorClient(res, 400, "No se pudo descartar la donación", error_servicio);
        }

        return handleSuccess(res, 200, "Solicitud de donación pendiente descartada", resultado);
    } catch (error) {
        console.error("Error en eliminarDonacionPendiente controller:", error);
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
};

export const obtenerEstadoAporte = async (req, res) => {
    try {
        const { error, value } = idValidation.validate(req.params);
        if (error) return handleErrorClient(res, 400, "URL inválida", error.details[0].message);

        const [resultado, error_servicio] = await obtenerEstadoAporteService(value.id);
        if (error_servicio) return handleErrorClient(res, 404, error_servicio);

        return handleSuccess(res, 200, "Estado del aporte obtenido", resultado);
    } catch (error) {
        console.error("Error en obtenerEstadoAporte controller:", error);
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
};

export const obtenerRecaudacion = async (req, res) => {
    try {
        const { error, value } = filtroRecaudacionValidation.validate(req.query);
        if (error) return handleErrorClient(res, 400, "Período inválido", error.details[0].message);

        const [datos, error_servicio] = await obtenerRecaudacionService(value);
        if (error_servicio) return handleErrorServer(res, 500, error_servicio);

        return handleSuccess(res, 200, "Recaudaciones obtenidas", datos);
    } catch (error) {
        console.error("Error en obtenerRecaudacion controller:", error);
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
};

export const exportarRecaudacion = async (req, res) => {
    try {
        const { error, value } = filtroRecaudacionValidation.validate(req.query);
        if (error) return handleErrorClient(res, 400, "Período inválido", error.details[0].message);

        const [archivo, error_servicio] = await exportarRecaudacionService(value);
        if (error_servicio) return handleErrorServer(res, 500, error_servicio);

        res.set("Content-Disposition", `attachment; filename="${archivo.nombreArchivo}"`);
        return res.type("text/csv; charset=utf-8").send(archivo.contenido);
    } catch (error) {
        console.error("Error en exportarRecaudacion controller:", error);
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
};

export const desactivarSuscripcion = async (req, res) => {
    try {
        const { error: errorId, value: valueId } = idValidation.validate(req.params);
        if (errorId) return handleErrorClient(res, 400, "URL inválida", errorId.details[0].message);

        const { error, value } = desactivarValidation.validate(req.body);
        if (error) return handleErrorClient(res, 400, "Error de validación", error.details[0].message);

        const suscripcionId = valueId.id;
        const usuarioId = req.user.usuarioId;

        const [resultado, error_servicio] = await desactivarSuscripcionService(suscripcionId, usuarioId, value.motivo);
        if (error_servicio) return handleErrorClient(res, 400, "No se pudo desactivar la suscripción", error_servicio);

        return handleSuccess(res, 200, "Suscripción desactivada. Se conservan los aportes recibidos.", resultado);
    } catch (error) {
        console.error("Error en desactivarSuscripcion controller:", error);
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
};
