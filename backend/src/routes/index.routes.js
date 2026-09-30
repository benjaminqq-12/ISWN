"use strict";

import { Router } from "express";
import donacionRoutes from "./donacion.routes.js";
import mascotasRoutes from "./mascota.routes.js";
import authRoutes from "./auth.routes.js";
import voluntarioRoutes from "./voluntario.routes.js";

const router = Router();

router
    .use("/auth", authRoutes)
    .use("/donacion", donacionRoutes)
    .use("/mascotas", mascotasRoutes)
    .use("/voluntarios", voluntarioRoutes);

export default router;