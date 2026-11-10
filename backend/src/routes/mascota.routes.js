
"use strict";

import { Router } from "express";
import passport from "passport";

import {
  crearMascotaController,
  getMascotasController,
  getMascotaController,
  getMascotaInternaController,
  getMascotasInternasController,
  actualizarMascotaController,
  eliminarMascotaController,
} from "../controllers/mascota.controller.js";

const router = Router();

// ==========================================
// LISTADO PÚBLICO DE MASCOTAS
// ==========================================
router.get("/", getMascotasController);

// ==========================================
// LISTADO INTERNO DE MASCOTAS
// Voluntario, Veterinario y Administrador
// ==========================================
router.get(
  "/internas",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    if (
      !req.user?.activo ||
      !["Voluntario", "Veterinario", "Admin"].includes(req.user.rol)
    ) {
      return res.status(403).json({
        status: "Client error",
        message:
          "Solo Voluntarios, Veterinarios y Administradores pueden consultar todas las mascotas",
      });
    }

    return next();
  },
  getMascotasInternasController
);


// ==========================================
// CONSULTA INTERNA DE UNA MASCOTA
// Voluntario, Veterinario y Administrador
// ==========================================
router.get(
  "/:id/interno",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    if (
      !req.user?.activo ||
      !["Voluntario", "Veterinario", "Admin"].includes(req.user.rol)
    ) {
      return res.status(403).json({
        status: "Client error",
        message:
          "Solo Voluntarios, Veterinarios y Administradores pueden ver los datos internos",
      });
    }

    return next();
  },
  getMascotaInternaController
);

// ==========================================
// CONSULTA PÚBLICA DE UNA MASCOTA
// ==========================================
router.get("/:id", getMascotaController);

// ==========================================
// CREAR MASCOTA
// Voluntario y Administrador
// ==========================================
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    if (
      !req.user?.activo ||
      !["Voluntario", "Admin"].includes(req.user.rol)
    ) {
      return res.status(403).json({
        status: "Client error",
        message:
          "Solo Voluntarios y Administradores pueden crear mascotas",
      });
    }

    return next();
  },
  crearMascotaController
);

// ==========================================
// ACTUALIZAR MASCOTA
// Voluntario y Administrador
// ==========================================
router.put(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    if (
      !req.user?.activo ||
      !["Voluntario", "Admin"].includes(req.user.rol)
    ) {
      return res.status(403).json({
        status: "Client error",
        message:
          "Solo Voluntarios y Administradores pueden actualizar mascotas",
      });
    }

    return next();
  },
  actualizarMascotaController
);

// ==========================================
// ELIMINAR MASCOTA
// Voluntario y Administrador
// ==========================================
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    if (
      !req.user?.activo ||
      !["Voluntario", "Admin"].includes(req.user.rol)
    ) {
      return res.status(403).json({
        status: "Client error",
        message:
          "Solo Voluntarios y Administradores pueden eliminar mascotas",
      });
    }

    return next();
  },
  eliminarMascotaController
);

export default router;
