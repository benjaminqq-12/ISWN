import Joi from "joi";
import { ESTADOS_MASCOTA, TIPOS_EVENTO_MANUAL } from "../config/estadosMascota.js";

export const mascotaIdParamValidation = Joi.object({
    id: Joi.number().integer().positive().max(2147483647).required().messages({
        "number.base": "El id de la mascota debe ser un número.",
        "number.positive": "El id de la mascota debe ser positivo.",
        "number.max": "El id de la mascota no es válido.",
        "any.required": "El id de la mascota es obligatorio."
    })
});

export const agregarEventoBodyValidation = Joi.object({
    tipoEvento: Joi.string().valid(...TIPOS_EVENTO_MANUAL).required().messages({
        "any.only": `El tipo de evento debe ser uno de: ${TIPOS_EVENTO_MANUAL.join(", ")}.`,
        "string.empty": "El tipo de evento no puede estar vacío.",
        "any.required": "El tipo de evento es obligatorio."
    }),
    descripcion: Joi.string().trim().max(512).required().messages({
        "string.empty": "La descripción del evento no puede estar vacía.",
        "string.max": "La descripción no debe exceder los 512 caracteres.",
        "any.required": "La descripción del evento es obligatoria."
    }),
});

export const cambiarEstadoMascotaBodyValidation = Joi.object({
    nuevoEstado: Joi.string().valid(...ESTADOS_MASCOTA).required().messages({
        "any.only": `El nuevo estado debe ser uno de: ${ESTADOS_MASCOTA.join(", ")}.`,
        "string.empty": "El nuevo estado no puede estar vacío.",
        "any.required": "El nuevo estado es obligatorio."
    }),
    detalle: Joi.string().trim().max(512).required().messages({
        "string.empty": "Debes adjuntar un detalle del motivo del cambio de estado.",
        "string.max": "El detalle no debe exceder los 512 caracteres.",
        "any.required": "El detalle del cambio de estado es obligatorio."
    }),
});