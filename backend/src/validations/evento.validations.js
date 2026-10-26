import Joi from "joi";

const fechaValidation = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).custom((valor, helpers) => {
    const fecha = new Date(`${valor}T12:00:00Z`);
    if (Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== valor) {
        return helpers.error("any.invalid");
    }
    return valor;
}).messages({
    "string.pattern.base": "La fecha debe tener el formato yyyy-mm-dd.",
    "any.invalid": "La fecha del evento no es válida.",
    "any.required": "La fecha es obligatoria."
});

const horaValidation = Joi.string().pattern(/^([01][0-9]|2[0-3]):[0-5][0-9]$/).messages({
    "string.pattern.base": "La hora debe tener el formato HH:MM (ej: 14:30).",
    "string.empty": "La hora no puede estar vacía.",
    "any.required": "Debes indicar las horas de inicio y término."
});

export const eventoBodyValidation = Joi.object({
    titulo: Joi.string().trim().max(150).required().messages({
        "string.empty": "El título no puede estar vacío.",
        "string.max": "El título no debe exceder los 150 caracteres.",
        "any.required": "El título es obligatorio."
    }),
    descripcion: Joi.string().trim().required().messages({
        "string.empty": "La descripción no puede estar vacía.",
        "any.required": "La descripción es obligatoria."
    }),
    fechaEvento: fechaValidation.required(),
    horaInicio: horaValidation.required(),
    horaFin: horaValidation.required(),
    capacidadMaxima: Joi.number().integer().min(1).max(2147483647).required().messages({
        "number.base": "La capacidad máxima debe ser un número.",
        "number.integer": "La capacidad máxima debe ser un número entero.",
        "number.min": "La capacidad máxima debe ser al menos 1.",
        "any.required": "La capacidad máxima es obligatoria."
    }),
    lugar: Joi.string().trim().max(200).required().messages({
        "string.empty": "El lugar no puede estar vacío.",
        "string.max": "El lugar no debe exceder los 200 caracteres.",
        "any.required": "El lugar es obligatorio."
    }),
    organizadorId: Joi.number().integer().positive().required().messages({
        "number.base": "Debes seleccionar un organizador.",
        "number.positive": "El id del organizador debe ser positivo.",
        "any.required": "Debes asignar un organizador al evento."
    }),
    categoria: Joi.string().valid("adopcion", "salud", "taller", "feria").required().messages({
        "any.only": "La categoría debe ser adopcion, salud, taller o feria.",
        "any.required": "La categoría es obligatoria."
    })
});

export const eventoUpdateValidation = eventoBodyValidation.fork(
    ["titulo", "descripcion", "fechaEvento", "horaInicio", "horaFin", "capacidadMaxima", "lugar", "organizadorId", "categoria"],
    campo => campo.optional()
).keys({
    estado: Joi.string().valid("Activo", "Finalizado", "Cancelado").optional().messages({
        "any.only": "El estado solo puede ser Activo, Finalizado o Cancelado."
    })
});

export const idValidation = Joi.object({
    id: Joi.number().integer().positive().required().messages({
        "number.base": "El id del evento debe ser un número.",
        "number.positive": "El id del evento debe ser positivo.",
        "any.required": "El id del evento es obligatorio."
    })
});

export const eventoUsuarioIdValidation = Joi.object({
    eventoId: Joi.number().integer().positive().required(),
    usuarioId: Joi.number().integer().positive().required()
});

export const eventoBorradorValidation = eventoBodyValidation.fork(
    ["descripcion", "fechaEvento", "horaInicio", "horaFin", "capacidadMaxima", "lugar", "organizadorId", "categoria"],
    campo => campo.optional().allow(null)
).keys({ version: Joi.number().integer().min(1).optional() });
export const publicarEventoValidation = eventoBodyValidation.keys({
    version: Joi.number().integer().min(1).required()
});