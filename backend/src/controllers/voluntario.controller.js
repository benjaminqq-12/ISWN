"use strict";

import { promises as dns } from "node:dns";
import {
    crearVoluntario,
    obtenerVoluntarios,
    obtenerVoluntarioPorId,
    obtenerVoluntarioPorRut,
    obtenerVoluntarioPorEmail,
} from "../services/voluntario.service.js";

function normalizarEmail(email) { return email.trim().toLowerCase(); }
function validarFormatoEmail(email) {
    return email.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function verificarDominioEmail(email) {
    const dominio = email.split("@")[1];
    try {
        const mx = await dns.resolveMx(dominio);
        return mx.some(registro => registro.exchange && registro.exchange !== ".");
    } catch (error) {
        if (error.code === "ENOTFOUND") return false;
        if (error.code !== "ENODATA") throw error;
        try {
            if ((await dns.resolve4(dominio)).length > 0) return true;
        } catch (error4) {
            if (!["ENODATA", "ENOTFOUND"].includes(error4.code)) throw error4;
        }
        try {
            return (await dns.resolve6(dominio)).length > 0;
        } catch (error6) {
            if (["ENODATA", "ENOTFOUND"].includes(error6.code)) return false;
            throw error6;
        }
    }
}

// IMPORTANTE: este endpoint público permite descubrir correos registrados.
// Se proporciona para pruebas locales; antes de producción aplicar protección
// contra abuso, política de privacidad y revisión de seguridad.
export async function verificarCorreoController(req, res) {
    const { email } = req.body || {};
    if (typeof email !== "string" || !validarFormatoEmail(normalizarEmail(email))) {
        return res.status(400).json({ message: "Ingresa un correo electrónico válido." });
    }
    try {
        const existe = Boolean(await obtenerVoluntarioPorEmail(normalizarEmail(email)));
        return res.status(200).json({ existe });
    } catch (error) {
        console.error("Error al comprobar correo:", error);
        return res.status(500).json({ message: "No se pudo comprobar el correo." });
    }
}

export async function crearVoluntarioController(req, res) {
    try {
        const {
            nombreCompleto, rut, fechaNacimiento, telefono, email, direccion,
            contactoEmergencia, areasInteres, disponibilidad, transporte,
        } = req.body;

        if (!nombreCompleto || !rut || !telefono || !email || !direccion ||
            !contactoEmergencia?.nombre || !contactoEmergencia?.parentesco ||
            !contactoEmergencia?.telefono) {
            return res.status(400).json({ message: "Faltan campos obligatorios." });
        }
        if (typeof email !== "string") {
            return res.status(400).json({ message: "El correo electrónico no es válido." });
        }
        const correoNormalizado = normalizarEmail(email);
        if (!validarFormatoEmail(correoNormalizado)) {
            return res.status(400).json({ message: "Ingresa un correo electrónico válido de máximo 120 caracteres." });
        }
        if (await obtenerVoluntarioPorEmail(correoNormalizado)) {
            return res.status(409).json({ message: "Ya existe un voluntario registrado con este correo electrónico." });
        }
        try {
            if (!(await verificarDominioEmail(correoNormalizado))) {
                return res.status(400).json({ message: "El dominio del correo no parece estar configurado para recibir mensajes." });
            }
        } catch (error) {
            console.error("Error al verificar dominio:", error);
            return res.status(503).json({ message: "No pudimos verificar el dominio del correo en este momento. Intenta nuevamente." });
        }
        if (await obtenerVoluntarioPorRut(rut)) {
            return res.status(409).json({ message: "Ya existe una postulación con este RUT." });
        }
        const datosVoluntario = {
            nombreCompleto, rut, fechaNacimiento: fechaNacimiento || null,
            telefono, email: correoNormalizado, direccion,
            contactoNombre: contactoEmergencia.nombre,
            contactoParentesco: contactoEmergencia.parentesco,
            contactoTelefono: contactoEmergencia.telefono,
            areasInteres: Array.isArray(areasInteres) ? areasInteres : [],
            disponibilidad: disponibilidad || {},
            disponibleTraslados: transporte?.disponibleTraslados === true,
            poseeVehiculo: transporte?.poseeVehiculo === true,
            tipoVehiculo: transporte?.tipoVehiculo || null,
            estado: "Pendiente", observaciones: null,
        };
        const voluntario = await crearVoluntario(datosVoluntario);
        return res.status(201).json({ message: "Postulación registrada correctamente.", data: voluntario });
    } catch (error) {
        console.error("Error al registrar voluntario:", error);
        if (error.code === "23505" || error.driverError?.code === "23505") {
            return res.status(409).json({ message: "Ya existe un registro con el RUT o correo ingresado." });
        }
        return res.status(500).json({ message: "Error interno al registrar la postulación." });
    }
}

export async function obtenerVoluntariosController(req, res) {
    try {
        const voluntarios = await obtenerVoluntarios();
        return res.status(200).json({ message: "Voluntarios obtenidos correctamente.", data: voluntarios });
    } catch (error) {
        console.error("Error al obtener voluntarios:", error);
        return res.status(500).json({ message: "Error interno al obtener voluntarios." });
    }
}

export async function obtenerVoluntarioPorIdController(req, res) {
    try {
        const voluntario = await obtenerVoluntarioPorId(req.params.id);
        if (!voluntario) return res.status(404).json({ message: "Voluntario no encontrado." });
        return res.status(200).json({ message: "Voluntario encontrado.", data: voluntario });
    } catch (error) {
        console.error("Error al obtener voluntario:", error);
        return res.status(500).json({ message: "Error interno al obtener el voluntario." });
    }
}
