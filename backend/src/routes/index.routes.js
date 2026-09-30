"use strict";

import { Router } from "express";
import donacionRoutes from "./donacion.routes.js";
import mascotasRoutes from "./mascota.routes.js";
import authRoutes from "./auth.routes.js";
import solicitudAdopcionRoutes from "./solicitudAdopcion.routes.js";
import usuarioRoutes from "./usuario.routes.js";


const router = Router();

router
    .use("/auth", authRoutes)
    .use("/donacion", donacionRoutes)
    .use("/mascotas", mascotasRoutes)
    .use("/solicitudes-adopcion", solicitudAdopcionRoutes)
    .use("/usuarios", usuarioRoutes);

    

export default router;