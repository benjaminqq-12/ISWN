import Joi from "joi";

export const eventoBodyValidation = Joi.object({
    titulo: Joi.string().max(150).required().messages({
        "string.empty": "El título no puede estar vacío.",
        "string.max": "El título no debe exceder los 150 caracteres.",
        "any.required": "El título es obligatorio."
    }),
    descripcion: Joi.string().required().messages({
        "string.empty": "La descripción no puede estar vacía.",
        "any.required": "La descripción es obligatoria."
    }),
    fechaEvento: Joi.date().iso().min("now").required().messages({
        "date.format": "La fecha debe tener un formato válido (ej: yyyy-mm-dd).",
        "date.min": "La fecha del evento no puede estar en el pasado.",
        "any.required": "La fecha es obligatoria."
    }),
    horaInicio: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required().messages({
        "string.pattern.base": "La hora debe tener el formato hh:mm (ej: 14:30).",
        "string.empty": "La hora de inicio no puede estar vacía.",
        "any.required": "La hora de inicio es obligatoria."
    }),
    lugar: Joi.string().max(200).required().messages({
        "string.empty": "El lugar no puede estar vacío.",
        "string.max": "El lugar no debe exceder los 200 caracteres.",
        "any.required": "El lugar es obligatorio."
    }),
    organizadorId: Joi.number().integer().positive().required().messages({
        "number.base": "El id del organizador debe ser un número.",
        "number.positive": "El id del organizador debe ser positivo.",
        "any.required": "Debes asignar un organizador al evento."
    }),
    categoria: Joi.string().valid("adopcion", "salud", "taller", "feria").required().messages({
    "any.only": "La categoría debe ser adopcion, salud, taller o feria.",
    "string.empty": "La categoría no puede estar vacía.",
    "any.required": "La categoría es obligatoria."
    }),
});

export const eventoUpdateValidation = Joi.object({
    titulo: Joi.string().max(150).optional().messages({
        "string.empty": "El título no puede estar vacío.",
        "string.max": "El título no debe exceder los 150 caracteres."
    }),
    descripcion: Joi.string().optional().messages({
        "string.empty": "La descripción no puede estar vacía."
    }),
    fechaEvento: Joi.date().iso().min("now").optional().messages({
        "date.format": "La fecha debe tener un formato válido.",
        "date.min": "La nueva fecha no puede estar en el pasado."
    }),
    horaInicio: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional().messages({
        "string.pattern.base": "La hora debe tener el formato hh:mm.",
        "string.empty": "La hora de inicio no puede estar vacía."
    }),
    lugar: Joi.string().max(200).optional().messages({
        "string.empty": "El lugar no puede estar vacío.",
        "string.max": "El lugar no debe exceder los 200 caracteres."
    }),
    estado: Joi.string().valid("Programado", "Finalizado", "Cancelado").optional().messages({
        "any.only": "El estado solo puede ser Programado, Finalizado o Cancelado."
    }),
    organizadorId: Joi.number().integer().positive().optional().messages({
        "number.base": "El id del organizador debe ser un número."
    }),
    categoria: Joi.string().valid("adopcion", "salud", "taller", "feria").optional().messages({
    "any.only": "La categoría debe ser adopcion, salud, taller o feria.",
    "string.empty": "La categoría no puede estar vacía."
    }),
});

export const idValidation = Joi.object({
    id: Joi.number().integer().positive().required().messages({
        "number.base": "El id del evento debe ser un número.",
        "number.positive": "El id del evento debe ser positivo.",
        "any.required": "El id del evento es obligatorio."
    })
});

export const eventoUsuarioIdValidation = Joi.object({
    eventoId: Joi.number().integer().positive().required().messages({
        "number.base": "El id del evento debe ser un número válido.",
        "any.required": "El id del evento es obligatorio."
    }),
    usuarioId: Joi.number().integer().positive().required().messages({
        "number.base": "El id del usuario debe ser un número válido.",
        "any.required": "El id del usuario es obligatorio."
    })
});