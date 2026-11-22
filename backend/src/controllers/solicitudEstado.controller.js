
"use strict";

import {
    handleErrorClient,
    handleErrorServer,
    handleSuccess,
} from "../handlers/responseHandlers.js";

import {
    crearSolicitudEstadoService,
    obtenerSolicitudesEstadoService,
    resolverSolicitudEstadoService,
    cambiarEstadoSanitarioMascotaService,
} from "../services/solicitudEstado.service.js";

const ESTADOS_PERMITIDOS = [
    "En Cuarentena",
    "En Observación",
    "En Refugio",
];

function obtenerIdPositivo(valor) {
    const id = Number(valor);

    if (
        !/^\d+$/.test(String(valor)) ||
        !Number.isSafeInteger(id) ||
        id < 1 ||
        id > 2147483647
    ) {
        return null;
    }

    return id;
}

// --------------------------------------------------
// CONTROLADOR ANTIGUO: Crear solicitud de cambio
// --------------------------------------------------

export async function crearSolicitudEstadoController(req, res) {
    const mascotaId = obtenerIdPositivo(req.body?.mascotaId);

    if (mascotaId === null) {
        return handleErrorClient(
            res,
            400,
            "Debes proporcionar un mascotaId válido"
        );
    }

    const { estadoSolicitado, motivo } = req.body;

    if (!ESTADOS_PERMITIDOS.includes(estadoSolicitado)) {
        return handleErrorClient(
            res,
            400,
            "El estado solicitado debe ser En Cuarentena o En Observación"
        );
    }

    if (
        typeof motivo !== "string" ||
        !motivo.trim() ||
        motivo.trim().length > 512
    ) {
        return handleErrorClient(
            res,
            400,
            "El motivo es obligatorio y debe tener hasta 512 caracteres"
        );
    }

    const solicitanteId = obtenerIdPositivo(req.user?.usuarioId);

    if (solicitanteId === null) {
        return handleErrorClient(
            res,
            401,
            "No se pudo identificar al usuario autenticado"
        );
    }

    const [solicitud, error] = await crearSolicitudEstadoService({
        mascotaId,
        estadoSolicitado,
        motivo: motivo.trim(),
        solicitanteId,
    });

    if (error) {
        if (error === "Mascota no encontrada") {
            return handleErrorClient(res, 404, error);
        }

        if (
            error === "La mascota ya tiene ese estado" ||
            error === "La mascota ya tiene una solicitud de estado pendiente"
        ) {
            return handleErrorClient(res, 409, error);
        }

        if (error.includes("usuario solicitante")) {
            return handleErrorClient(res, 403, error);
        }

        return handleErrorServer(res, 500, error);
    }

    return handleSuccess(
        res,
        201,
        "Solicitud de cambio de estado registrada",
        solicitud
    );
}

// --------------------------------------------------
// CONTROLADOR ANTIGUO: Obtener solicitudes
// --------------------------------------------------

export async function obtenerSolicitudesEstadoController(req, res) {
    const usuarioId = obtenerIdPositivo(req.user?.usuarioId);

    if (usuarioId === null) {
        return handleErrorClient(
            res,
            401,
            "No se pudo identificar al usuario autenticado"
        );
    }

    const [solicitudes, error] =
        await obtenerSolicitudesEstadoService({
            usuarioId,
            rol: req.user.rol,
        });

    if (error) {
        return handleErrorServer(res, 500, error);
    }

    return handleSuccess(
        res,
        200,
        "Solicitudes de estado consultadas correctamente",
        solicitudes
    );
}

// --------------------------------------------------
// CONTROLADOR ANTIGUO: Resolver solicitud
// --------------------------------------------------

export async function resolverSolicitudEstadoController(req, res) {
    const solicitudEstadoId = obtenerIdPositivo(req.params.id);

    if (solicitudEstadoId === null) {
        return handleErrorClient(
            res,
            400,
            "El ID de la solicitud debe ser un entero positivo válido"
        );
    }

    const revisorId = obtenerIdPositivo(req.user?.usuarioId);

    if (revisorId === null) {
        return handleErrorClient(
            res,
            401,
            "No se pudo identificar al administrador autenticado"
        );
    }

    const { decision, comentarioResolucion } = req.body || {};

    if (!["APROBADA", "RECHAZADA"].includes(decision)) {
        return handleErrorClient(
            res,
            400,
            "La decisión debe ser APROBADA o RECHAZADA"
        );
    }

    if (
        comentarioResolucion !== undefined &&
        comentarioResolucion !== null &&
        (
            typeof comentarioResolucion !== "string" ||
            comentarioResolucion.trim().length > 512
        )
    ) {
        return handleErrorClient(
            res,
            400,
            "El comentario debe tener hasta 512 caracteres"
        );
    }

    const [solicitud, error] =
        await resolverSolicitudEstadoService({
            solicitudEstadoId,
            decision,
            comentarioResolucion:
                comentarioResolucion?.trim() || null,
            revisorId,
        });

    if (error) {
        if (
            error === "Solicitud no encontrada" ||
            error === "Mascota no encontrada"
        ) {
            return handleErrorClient(res, 404, error);
        }

        if (error === "La solicitud ya fue resuelta") {
            return handleErrorClient(res, 409, error);
        }

        if (error.includes("administrador")) {
            return handleErrorClient(res, 403, error);
        }

        return handleErrorServer(res, 500, error);
    }

    return handleSuccess(
        res,
        200,
        decision === "APROBADA"
            ? "Solicitud aprobada y estado de la mascota actualizado"
            : "Solicitud rechazada",
        solicitud
    );
}

// --------------------------------------------------
// NUEVO CONTROLADOR: Cambio directo de estado sanitario
// --------------------------------------------------

export async function cambiarEstadoSanitarioMascotaController(req, res) {
    const mascotaId = obtenerIdPositivo(req.params.id);

    if (mascotaId === null) {
        return handleErrorClient(
            res,
            400,
            "El ID de la mascota debe ser un entero positivo válido"
        );
    }

    const veterinarioId = obtenerIdPositivo(req.user?.usuarioId);

    if (veterinarioId === null) {
        return handleErrorClient(
            res,
            401,
            "No se pudo identificar al veterinario autenticado"
        );
    }

    const { estado } = req.body || {};

    if (!ESTADOS_PERMITIDOS.includes(estado)) {
        return handleErrorClient(
            res,
            400,
            "El estado debe ser En Cuarentena o En Observación o En Refugio"
        );
    }

    const [mascota, error] =
        await cambiarEstadoSanitarioMascotaService({
            mascotaId,
            estado,
            veterinarioId,
        });

    if (error) {
        if (error === "Mascota no encontrada") {
            return handleErrorClient(res, 404, error);
        }

        if (
            error === "El usuario no es un veterinario válido o está inactivo"
        ) {
            return handleErrorClient(res, 403, error);
        }

        if (
            error === "El estado sanitario solicitado no está permitido"
        ) {
            return handleErrorClient(res, 400, error);
        }

        if (error === "La mascota ya tiene ese estado") {
            return handleErrorClient(res, 409, error);
        }

        return handleErrorServer(res, 500, error);
    }

    return handleSuccess(
        res,
        200,
        "Estado sanitario de la mascota actualizado correctamente",
        mascota
    );
}
