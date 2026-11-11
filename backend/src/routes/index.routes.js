
"use strict";

import { Router } from "express";

import donacionRoutes from "./donacion.routes.js";
import atencionMedicaRoutes from "./atencionMedica.routes.js";
import eventoRoutes from "./evento.routes.js";
import mascotasRoutes from "./mascota.routes.js";
import authRoutes from "./auth.routes.js";
import voluntarioRoutes from "./voluntario.routes.js";
import solicitudAdopcionRoutes from "./solicitudAdopcion.routes.js";
import usuarioRoutes from "./usuario.routes.js";
import solicitudEstadoRoutes from "./solicitudEstado.routes.js";
import historialClinicoRoutes from "./historialClinico.routes.js";
import calendarioSanidadRoutes from "./calendarioSanidad.routes.js";
import vacunaRoutes from "./vacuna.routes.js";
import inventarioRoutes from "./inventario.routes.js";
import historialMascotaRoutes from "./historialMascota.routes.js";
import seguimientoAdopcionRoutes from "./seguimientoAdopcion.routes.js";

const router = Router();

router
    .use("/donacion", donacionRoutes)
    .use("/atenciones-medicas", atencionMedicaRoutes)
    .use("/vacunas", vacunaRoutes)
    .use("/eventos", eventoRoutes)
    .use("/auth", authRoutes)
    .use("/mascotas", mascotasRoutes)
    .use("/mascotas", historialMascotaRoutes)
    .use("/voluntarios", voluntarioRoutes)
    .use("/solicitudes-adopcion", solicitudAdopcionRoutes)
    .use("/usuarios", usuarioRoutes)
    .use("/solicitudes-estado", solicitudEstadoRoutes)
    .use("/historial-clinico", historialClinicoRoutes)
    .use("/calendario-sanidad", calendarioSanidadRoutes)
    .use("/inventario", inventarioRoutes)
    .use("/solicitudes-adopcion", seguimientoAdopcionRoutes)
    .use("/usuarios", usuarioRoutes);

export default router;
