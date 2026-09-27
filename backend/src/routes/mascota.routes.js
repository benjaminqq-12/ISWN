"use strict";
import { Router } from "express";
import {
  getMascotasController,
} from "../controllers/mascota.controller.js";

const router = Router();

router
  .get("/", getMascotasController);

export default router;