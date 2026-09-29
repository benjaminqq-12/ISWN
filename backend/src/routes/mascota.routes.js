"use strict";
import { Router } from "express";
import {
  crearMascotaController,
  getMascotasController,
} from "../controllers/mascota.controller.js";
import passport from "passport";

const router = Router();

router
  .get("/", getMascotasController)
  .post(
    "/",
    passport.authenticate("jwt", { session: false }),
    (req, res, next) => {
      if (!req.user?.activo || !["Voluntario", "Admin"].includes(req.user.rol)) {
        return res.status(403).json({
          status: "Client error",
          message: "Solo Voluntarios y Administradores pueden registrar mascotas",
        });
      }
      return next();
    },
    crearMascotaController
  );

export default router;