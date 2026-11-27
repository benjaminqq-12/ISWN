"use strict";

import { Router } from "express";
import passport from "passport";

import {
  listarInventario,
  obtenerItemInventario,
  crearItemInventario,
  editarItemInventario,
  registrarMovimientoInventario,
  listarMovimientosInventario,
  eliminarItemsInventario,
  eliminarItemInventario,
} from "../controllers/inventario.controller.js";

const router = Router();

// Autenticación y autorización de personal interno
router.use(
  passport.authenticate("jwt", { session: false }),
  (req, res, next) => {
    const rolesPermitidos = [
      "Admin",
      "Voluntario",
      "Veterinario",
    ];

    if (
      !req.user?.activo ||
      !rolesPermitidos.includes(req.user.rol)
    ) {
      return res.status(403).json({
        status: "Client error",
        message: "No tienes permisos para acceder al inventario",
      });
    }

    return next();
  }
);

router.delete("/lote", eliminarItemsInventario);

router.get("/", listarInventario);
router.get("/:id", obtenerItemInventario);
router.post("/", crearItemInventario);
router.put("/:id", editarItemInventario);
router.get("/:id/movimientos", listarMovimientosInventario);
router.post("/:id/movimientos", registrarMovimientoInventario);
router.delete("/:id", eliminarItemInventario);
export default router;