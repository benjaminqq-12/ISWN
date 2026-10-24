"use strict";

import { Router } from "express";

import {
    createAtencionMedicaController
} from "../controllers/atencionMedica.controller.js";

const router = Router();

router.post("/", createAtencionMedicaController);

export default router;