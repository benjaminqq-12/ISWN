import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";
import { procesarDonacionService } from "../services/donacion.service.js";

export const crearDonacion = async (req, res) => {
    try {
        const datosDonacion = req.body;

        
        datosDonacion.usuarioId = req.user?.id || 1;

        const [resultado, error_servicio] = await procesarDonacionService(datosDonacion);

        if (error_servicio) {
            return handleErrorClient(res, 400, "No se pudo registrar la donacion", error_servicio);
        }

        return handleSuccess(res, 201, "Donacion registrada exitosamente", resultado);
    } catch (error) {
        console.error("Error en crearDonacion controller:", error);
        return handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
};