"use strict";

import { Router } from "express";

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

import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { authorizeRoles } from "../middlewares/authorization.middleware.js";

const router = Router();
const soloPersonal = [
  authenticateJwt,
  authorizeRoles("Admin", "Voluntario", "Veterinario"),
];

// Autenticación y autorización de personal interno
router.use(soloPersonal);

router.delete("/lote", soloPersonal, eliminarItemsInventario);

router.get("/", soloPersonal,listarInventario);
router.get("/:id", soloPersonal,obtenerItemInventario);
router.post("/", soloPersonal,crearItemInventario);
router.put("/:id", soloPersonal,editarItemInventario);
router.get("/:id/movimientos", soloPersonal, listarMovimientosInventario);
router.post("/:id/movimientos", soloPersonal, registrarMovimientoInventario);
router.delete("/:id", soloPersonal, eliminarItemInventario);
export default router;