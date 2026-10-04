"use strict";

import { Router } from "express";
import { crearDonacion } from "../controllers/donacion.controller.js";

const router = Router();

router
    .post("/", crearDonacion);

export default router;