"use strict";
import { Router } from "express";
import {
  createMascotaController,
} from "../controllers/mascota.controller.js";

const router = Router();

router
  .get("/", getMascotaController);

export default router;