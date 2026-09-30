"use strict";

import { Router } from "express";

import donacionRoutes from "./donacion.routes.js";
import atencionMedicaRoutes from "./atencionMedica.routes.js";

const router = Router();

router
    .use("/donacion", donacionRoutes)
    .use("/atenciones-medicas", atencionMedicaRoutes);

export default router;