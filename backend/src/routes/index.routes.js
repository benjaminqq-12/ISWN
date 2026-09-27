"use strict";

import { Router } from "express";
import donacionRoutes from "./donacion.routes.js";
import mascotasRoutes from "./mascota.routes.js";

const router = Router();

router
    .use("/donacion", donacionRoutes)
    .use("/mascotas", mascotasRoutes);

export default router;