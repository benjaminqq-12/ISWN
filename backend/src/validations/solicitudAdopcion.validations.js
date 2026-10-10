import Joi from "joi";
import { ESTADOS_SOLICITUD } from "../config/estadosSolicitud.js";

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
    usuarioId: Joi.number().integer().positive().required().messages({
        "number.base": "El id del usuario que autoriza debe ser un número.",
        "number.positive": "El id del usuario que autoriza debe ser positivo.",
        "any.required": "Debes indicar el usuario que autoriza el avance."
    }),
});

export const solicitudIdValidation = Joi.object({
    id: Joi.number().integer().positive().required().messages({
        "number.base": "El id de la solicitud debe ser un número.",
        "number.positive": "El id de la solicitud debe ser positivo.",
        "any.required": "El id de la solicitud es obligatorio."
    })
});