"use strict";
import { Router } from "express";
import {
  getUsuariosController,
} from "../controllers/usuario.controller.js";

const router = Router();

router
  .get("/", getUsuariosController);

export default router;