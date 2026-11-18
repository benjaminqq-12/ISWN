"use strict";
import { Router } from "express";
import {
  getUsuariosController,
  crearUsuarioController,
} from "../controllers/usuario.controller.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { authorizeRoles } from "../middlewares/authorization.middleware.js";

const router = Router();

router
  .get("/", authenticateJwt, authorizeRoles("Admin"), getUsuariosController)
  .post("/", authenticateJwt, authorizeRoles("Admin"), crearUsuarioController);

export default router;