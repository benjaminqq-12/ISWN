import Joi from "joi";
import { ESTADOS_SOLICITUD, TIPOS_CIERRE } from "../config/estadosSolicitud.js";

export const avanzarEstadoBodyValidation = Joi.object({
    nuevoEstado: Joi.string().valid(...Object.values(ESTADOS_SOLICITUD)).required().messages({
        "any.only": `El nuevo estado debe ser uno de: ${Object.values(ESTADOS_SOLICITUD).join(", ")}.`,
        "string.empty": "El nuevo estado no puede estar vacío.",
        "any.required": "El nuevo estado es obligatorio."
    }),
    detalle: Joi.string().trim().max(512).required().messages({
        "string.empty": "Debes adjuntar un detalle de cómo procedió este paso.",
        "string.max": "El detalle no debe exceder los 512 caracteres.",
        "any.required": "El detalle del paso es obligatorio."
    }),
    tipoCierre: Joi.any().when("nuevoEstado", {
        is: ESTADOS_SOLICITUD.CANCELADA,
        then: Joi.string().valid(...TIPOS_CIERRE).required().messages({
            "any.only": `El tipo de cierre debe ser uno de: ${TIPOS_CIERRE.join(", ")}.`,
            "string.empty": "El tipo de cierre no puede estar vacío.",
            "any.required": "Debes indicar el tipo de cierre al cancelar la solicitud."
        }),
        otherwise: Joi.forbidden().messages({
            "any.unknown": "El tipo de cierre solo aplica al cancelar una solicitud."
        }),
    })
});

export const crearSolicitudBodyValidation = Joi.object({
    mascotaId: Joi.number().integer().positive().required().messages({
        "number.base": "El id de la mascota debe ser un número.",
        "number.positive": "El id de la mascota debe ser positivo.",
        "any.required": "Debes indicar la mascota que quieres adoptar."
    }),
    telefono: Joi.string().trim().pattern(/^\+?[0-9\s-]{8,15}$/).required().messages({
        "string.empty": "El teléfono no puede estar vacío.",
        "string.pattern.base": "Ingresa un teléfono válido (ej: +56 9 1234 5678).",
        "any.required": "El teléfono de contacto es obligatorio."
    }),
    correo: Joi.string().trim().email({ tlds: { allow: false } }).max(100).required().messages({
        "string.empty": "El correo no puede estar vacío.",
        "string.email": "Ingresa un correo electrónico válido.",
        "string.max": "El correo no debe exceder los 100 caracteres.",
        "any.required": "El correo de contacto es obligatorio."
    }),
    direccion: Joi.string().trim().max(200).required().messages({
        "string.empty": "La dirección no puede estar vacía.",
        "string.max": "La dirección no debe exceder los 200 caracteres.",
        "any.required": "La dirección de la vivienda es obligatoria."
    }),
    mascotasActuales: Joi.string().trim().max(512).required().messages({
        "string.empty": "Cuéntanos qué mascotas tienes (si no tienes, escribe 'Ninguna').",
        "string.max": "La descripción de tus mascotas no debe exceder los 512 caracteres.",
        "any.required": "Debes describir las mascotas que tienes."
    }),
    motivoAdopcion: Joi.string().trim().max(512).required().messages({
        "string.empty": "Cuéntanos por qué quieres adoptar.",
        "string.max": "El motivo no debe exceder los 512 caracteres.",
        "any.required": "Debes indicar por qué quieres adoptar."
    }),
});

export const solicitudIdValidation = Joi.object({
    id: Joi.number().integer().positive().required().messages({
        "number.base": "El id de la solicitud debe ser un número.",
        "number.positive": "El id de la solicitud debe ser positivo.",
        "any.required": "El id de la solicitud es obligatorio."
    })
});