import Joi from "joi";
import { TIPOS_SEGUIMIENTO, RESULTADOS_SEGUIMIENTO } from "../config/estadosSolicitud.js";

export const seguimientoParamsValidation = Joi.object({
    id: Joi.number().integer().positive().max(2147483647).required().messages({
        "number.base": "El id de la solicitud debe ser un número.",
        "number.positive": "El id de la solicitud debe ser positivo.",
        "number.max": "El id de la solicitud no es válido.",
        "any.required": "El id de la solicitud es obligatorio."
    }),
    seguimientoId: Joi.number().integer().positive().max(2147483647).required().messages({
        "number.base": "El id del seguimiento debe ser un número.",
        "number.positive": "El id del seguimiento debe ser positivo.",
        "number.max": "El id del seguimiento no es válido.",
        "any.required": "El id del seguimiento es obligatorio."
    }),
});

export const registrarSeguimientoBodyValidation = Joi.object({
    tipo: Joi.string().valid(...TIPOS_SEGUIMIENTO).required().messages({
        "any.only": `El tipo de seguimiento debe ser uno de: ${TIPOS_SEGUIMIENTO.join(", ")}.`,
        "string.empty": "El tipo de seguimiento no puede estar vacío.",
        "any.required": "El tipo de seguimiento es obligatorio."
    }),
    resultado: Joi.string().valid(...RESULTADOS_SEGUIMIENTO).required().messages({
        "any.only": `El resultado debe ser uno de: ${RESULTADOS_SEGUIMIENTO.join(", ")}.`,
        "string.empty": "El resultado no puede estar vacío.",
        "any.required": "El resultado del seguimiento es obligatorio."
    }),
    detalle: Joi.string().trim().max(512).required().messages({
        "string.empty": "Debes adjuntar un detalle de cómo fue el seguimiento.",
        "string.max": "El detalle no debe exceder los 512 caracteres.",
        "any.required": "El detalle del seguimiento es obligatorio."
    }),
});