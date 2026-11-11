"use strict";
import { Router } from "express";
import {
    crearVoluntarioController,
    obtenerVoluntariosController,
    obtenerVoluntarioPorIdController,
    verificarCorreoController,
} from "../controllers/voluntario.controller.js";

const router = Router();
router.post("/", crearVoluntarioController);
router.get("/", obtenerVoluntariosController);
router.post("/verificar-correo", verificarCorreoController);
router.get("/:id", obtenerVoluntarioPorIdController);
export default router;
