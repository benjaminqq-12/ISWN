import { 
    handleErrorClient, 
    handleErrorServer, 
    handleSuccess 
} from "../handlers/responseHandlers.js";

import { procesarDonacionService } from "../services/donacion.service.js";

import { donacionBodyValidation } from "../validations/donacion.validations.js";

export const crearDonacion = async (req, res) => {
    try {
        const { error, value } = donacionBodyValidation.validate(req.body);
        if (error) {
            return handleErrorClient(res, 400, "Error en los datos de la donación", error.details[0].message);
        }

        const datosDonacion = value; 
        datosDonacion.usuarioId = req.user?.id || 1;

        const [resultado, error_servicio] = await procesarDonacionService(datosDonacion);

        if (error_servicio) {
            return handleErrorClient(res, 400, "No se pudo registrar la donación", error_servicio);
        }

        return handleSuccess(res, 201, "Donación registrada exitosamente", resultado);
    } catch (error) {
        console.error("Error en crearDonacion controller:", error);
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
};