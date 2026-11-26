"use strict";

import { Resolver } from "node:dns/promises";

import {
    crearVoluntario,
    obtenerVoluntarios,
    obtenerVoluntarioPorId,
    obtenerVoluntarioPorRut,
    obtenerVoluntarioPorEmail,
} from "../services/voluntario.service.js";

import {
    crearVoluntarioSchema,
    verificarCorreoSchema,
    validar,
} from "../validations/voluntario.validation.js";

// Configuración DNS para verificar dominios de correo.
const resolverCorreo = new Resolver();

resolverCorreo.setServers([
    "8.8.8.8",
    "1.1.1.1",
]);

// Comprueba si el dominio puede recibir correos.
async function verificarDominioEmail(email) {
    const dominio = email.split("@")[1];

    try {
        const mx = await resolverCorreo.resolveMx(dominio);

        return mx.some(
            registro => registro.exchange &&
            registro.exchange !== "."
        );

    } catch (error) {

        if (error.code === "ENOTFOUND") {
            return false;
        }

        if (error.code !== "ENODATA") {
            throw error;
        }

        try {
            if ((await resolverCorreo.resolve4(dominio)).length > 0) {
                return true;
            }

        } catch (error4) {
            if (!["ENODATA", "ENOTFOUND"].includes(error4.code)) {
                throw error4;
            }
        }

        try {
            return (
                await resolverCorreo.resolve6(dominio)
            ).length > 0;

        } catch (error6) {
            if (["ENODATA", "ENOTFOUND"].includes(error6.code)) {
                return false;
            }

            throw error6;
        }
    }
}

// IMPORTANTE: este endpoint público permite descubrir
// correos registrados. Antes de producción se debe
// aplicar protección contra abuso y revisión de seguridad.
export async function verificarCorreoController(req, res) {

    const { error, value } = validar(
        verificarCorreoSchema,
        req.body
    );

    if (error) {
        return res.status(400).json({
            message: error,
        });
    }

    try {
        const existe = Boolean(
            await obtenerVoluntarioPorEmail(value.email)
        );

        return res.status(200).json({
            existe,
        });

    } catch (error) {

        console.error("Error al comprobar correo:", error);

        return res.status(500).json({
            message: "No se pudo comprobar el correo.",
        });
    }
}

// RF1: Registro público de postulaciones.
export async function crearVoluntarioController(req, res) {

    try {

        // 1. Validar los datos mediante Joi.
        const { error, value } = validar(
            crearVoluntarioSchema,
            req.body
        );

        if (error) {
            return res.status(400).json({
                message: error,
            });
        }

        // 2. Obtener los datos validados y normalizados.
        const {
            nombreCompleto,
            rut,
            fechaNacimiento,
            telefono,
            email,
            direccion,
            contactoEmergencia,
            areasInteres,
            disponibilidad,
            transporte,
        } = value;

        // 3. Comprobar si el correo ya está registrado.
        if (await obtenerVoluntarioPorEmail(email)) {

            return res.status(409).json({
                message: "Ya existe un voluntario registrado con este correo electrónico.",
            });
        }

        // 4. Comprobar si el RUT ya está registrado.
        if (await obtenerVoluntarioPorRut(rut)) {

            return res.status(409).json({
                message: "Ya existe una postulación con este RUT.",
            });
        }

        // 5. Verificar el dominio del correo electrónico.
        try {

            if (!(await verificarDominioEmail(email))) {

                return res.status(400).json({
                    message: "El dominio del correo no parece estar configurado para recibir mensajes.",
                });
            }

        } catch (error) {

            console.error("Error al verificar dominio:", error);

            return res.status(503).json({
                message: "No pudimos verificar el dominio del correo en este momento. Intenta nuevamente.",
            });
        }

        // 6. Preparar los datos para PostgreSQL.
        const datosVoluntario = {

            nombreCompleto,
            rut,
            fechaNacimiento: fechaNacimiento || null,
            telefono,
            email,
            direccion,

            contactoNombre: contactoEmergencia.nombre,
            contactoParentesco: contactoEmergencia.parentesco,
            contactoTelefono: contactoEmergencia.telefono,

            areasInteres,
            disponibilidad,

            disponibleTraslados: transporte.disponibleTraslados,
            poseeVehiculo: transporte.poseeVehiculo,
            tipoVehiculo: transporte.tipoVehiculo || null,

            // El estado inicial siempre es Pendiente.
            estado: "Pendiente",
            observaciones: null,
        };

        // 7. Registrar la postulación en la base de datos.
        const voluntario = await crearVoluntario(
            datosVoluntario
        );

        // 8. Responder con el registro creado.
        return res.status(201).json({
            message: "Postulación registrada correctamente.",
            data: voluntario,
        });

    } catch (error) {

        console.error("Error al registrar voluntario:", error);

        // PostgreSQL: violación de restricción UNIQUE.
        if (
            error.code === "23505" ||
            error.driverError?.code === "23505"
        ) {

            return res.status(409).json({
                message: "Ya existe un registro con el RUT o correo ingresado.",
            });
        }

        return res.status(500).json({
            message: "Error interno al registrar la postulación.",
        });
    }
}

// Obtener todos los voluntarios.
export async function obtenerVoluntariosController(req, res) {

    try {

        const voluntarios = await obtenerVoluntarios();

        return res.status(200).json({
            message: "Voluntarios obtenidos correctamente.",
            data: voluntarios,
        });

    } catch (error) {

        console.error("Error al obtener voluntarios:", error);

        return res.status(500).json({
            message: "Error interno al obtener voluntarios.",
        });
    }
}

// Obtener un voluntario por su ID.
export async function obtenerVoluntarioPorIdController(req, res) {

    try {

        const voluntario = await obtenerVoluntarioPorId(
            req.params.id
        );

        if (!voluntario) {

            return res.status(404).json({
                message: "Voluntario no encontrado.",
            });
        }

        return res.status(200).json({
            message: "Voluntario encontrado.",
            data: voluntario,
        });

    } catch (error) {

        console.error("Error al obtener voluntario:", error);

        return res.status(500).json({
            message: "Error interno al obtener el voluntario.",
        });
    }
}