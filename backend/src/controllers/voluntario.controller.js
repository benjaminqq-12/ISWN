"use strict";

import {
    crearVoluntario,
    obtenerVoluntarios,
    obtenerVoluntarioPorId,
    obtenerVoluntarioPorRut,
} from "../services/voluntario.service.js";

/*
=========================================
REGISTRAR VOLUNTARIO / POSTULACIÓN
=========================================
*/

export async function crearVoluntarioController(req, res) {
    try {
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
        } = req.body;

        // Validación de campos obligatorios
        if (
            !nombreCompleto ||
            !rut ||
            !fechaNacimiento ||
            !telefono ||
            !email ||
            !direccion ||
            !contactoEmergencia?.nombre ||
            !contactoEmergencia?.parentesco ||
            !contactoEmergencia?.telefono
        ) {
            return res.status(400).json({
                message: "Faltan campos obligatorios.",
            });
        }

        // Evitar RUT duplicado
        const voluntarioExistente = await obtenerVoluntarioPorRut(rut);

        if (voluntarioExistente) {
            return res.status(409).json({
                message: "Ya existe una postulación con este RUT.",
            });
        }

        /*
        IMPORTANTE:
        Esta será inicialmente una ruta pública.

        Por seguridad, NO aceptamos el estado enviado
        por el navegador o Postman.

        Toda postulación pública queda Pendiente.
        */
        const datosVoluntario = {
            nombreCompleto,
            rut,
            fechaNacimiento,
            telefono,
            email,
            direccion,

            contactoNombre: contactoEmergencia.nombre,
            contactoParentesco: contactoEmergencia.parentesco,
            contactoTelefono: contactoEmergencia.telefono,

            areasInteres: Array.isArray(areasInteres)
                ? areasInteres
                : [],

            disponibilidad: disponibilidad || {},

            disponibleTraslados:
                transporte?.disponibleTraslados === true,

            poseeVehiculo:
                transporte?.poseeVehiculo === true,

            tipoVehiculo:
                transporte?.tipoVehiculo || null,

            estado: "Pendiente",

            observaciones: null,
        };

        const voluntario = await crearVoluntario(datosVoluntario);

        return res.status(201).json({
            message: "Postulación registrada correctamente.",
            data: voluntario,
        });

    } catch (error) {
        console.error("Error al registrar voluntario:", error);

        return res.status(500).json({
            message: "Error interno al registrar la postulación.",
        });
    }
}

/*
=========================================
OBTENER TODOS LOS VOLUNTARIOS
=========================================
*/

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

/*
=========================================
OBTENER VOLUNTARIO POR ID
=========================================
*/

export async function obtenerVoluntarioPorIdController(req, res) {
    try {
        const { id } = req.params;

        const voluntario = await obtenerVoluntarioPorId(id);

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