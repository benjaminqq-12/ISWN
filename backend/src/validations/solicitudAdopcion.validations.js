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
});

export const solicitudIdValidation = Joi.object({
    id: Joi.number().integer().positive().required().messages({
        "number.base": "El id de la solicitud debe ser un número.",
        "number.positive": "El id de la solicitud debe ser positivo.",
        "any.required": "El id de la solicitud es obligatorio."
    })
});