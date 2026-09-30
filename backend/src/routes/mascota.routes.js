"use strict";
import { Router } from "express";
import {
  crearMascotaController,
  getMascotasController,
  getMascotaController,
  getMascotaInternaController,
  actualizarMascotaController,
  eliminarMascotaController,
} from "../controllers/mascota.controller.js";
import passport from "passport";

const router = Router();

router
  .get("/", getMascotasController)
  .get(
    "/:id/interno",
    passport.authenticate("jwt", { session: false }),
    (req, res, next) => {
      if (!req.user?.activo || !["Voluntario", "Admin"].includes(req.user.rol)) {
        return res.status(403).json({
          status: "Client error",
          message: "Solo Voluntarios y Administradores pueden ver los datos internos",
        });
      }
      return next();
    },
    getMascotaInternaController
  )
  .get("/:id", getMascotaController)
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
  )
  .put(
    "/:id",
    passport.authenticate("jwt", { session: false }),
    (req, res, next) => {
      if (!req.user?.activo || !["Voluntario", "Admin"].includes(req.user.rol)) {
        return res.status(403).json({
          status: "Client error",
          message: "Solo Voluntarios y Administradores pueden actualizar mascotas",
        });
      }
      return next();
    },
    actualizarMascotaController
  )
  .delete(
    "/:id",
    passport.authenticate("jwt", { session: false }),
    (req, res, next) => {
      if (!req.user?.activo || !["Voluntario", "Admin"].includes(req.user.rol)) {
        return res.status(403).json({
          status: "Client error",
          message: "Solo Voluntarios y Administradores pueden eliminar mascotas",
        });
      }
      return next();
    },
    eliminarMascotaController
  );



export default router;