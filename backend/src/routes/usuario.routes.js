"use strict";
import { Router } from "express";
import {
  getUsuariosController,
} from "../controllers/usuario.controller.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { authorizeRoles } from "../middlewares/authorization.middleware.js";

const router = Router();

router
  .get("/", authenticateJwt, authorizeRoles("Admin"), getUsuariosController);

export default router;