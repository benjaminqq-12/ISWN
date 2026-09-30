"use strict";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";
import { getMascotasService,
} from "../services/mascota.service.js";
import { AppDataSource } from "../config/configDb.js";
import MascotaSchema from "../entity/mascota.entity.js";

export async function getMascotasController(req, res) {
        try {
            const [mascotas, error] = await getMascotasService();
            if (error) return handleErrorClient(res, 404, error);
            handleSuccess(res, 200, "Mascotas encontrados", mascotas);
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Internal server error",
                error: error.message
            });
        }
}