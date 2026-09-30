"use strict";

import { Router } from "express";
import { iniciarSesionController } from "../controllers/auth.controller.js";

const router = Router();

router.post("/login", iniciarSesionController);

export default router;
