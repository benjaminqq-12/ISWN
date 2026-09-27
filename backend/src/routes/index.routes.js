"use strict";

import { Router } from "express";
import donacionRoutes from "./donacion.routes.js";
import eventoRoutes from "./evento.routes.js";

const router = Router();

router
    .use("/donacion", donacionRoutes)
    .use("/eventos", eventoRoutes);

export default router;