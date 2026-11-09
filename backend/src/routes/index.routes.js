"use strict";

import { Router } from "express";

import donacionRoutes from "./donacion.routes.js";
import atencionMedicaRoutes from "./atencionMedica.routes.js";
import eventoRoutes from "./evento.routes.js";
import mascotasRoutes from "./mascota.routes.js";
import authRoutes from "./auth.routes.js";
import voluntarioRoutes from "./voluntario.routes.js";
import solicitudAdopcionRoutes from "./solicitudAdopcion.routes.js";
import usuarioRoutes from "./usuario.routes.js";
import inventarioRoutes from "./inventario.routes.js";

const router = Router();

router
    .use("/donacion", donacionRoutes)
    .use("/atenciones-medicas", atencionMedicaRoutes)
    .use("/eventos", eventoRoutes)
    .use("/auth", authRoutes)
    .use("/mascotas", mascotasRoutes)
    .use("/voluntarios", voluntarioRoutes)
    .use("/solicitudes-adopcion", solicitudAdopcionRoutes)
    .use("/usuarios", usuarioRoutes)
    .use("/inventario", inventarioRoutes);

export default router;