import Joi from "joi";

export const donacionBodyValidation = Joi.object({
    categoriaDonacion: Joi.string().valid("Dinero", "Insumo").default("Dinero").required().messages({
        "any.only": "La categoría de donación debe ser 'Dinero' o 'Insumo'.",
        "any.required": "La categoría de donación es obligatoria.",
    }),
    modalidad: Joi.when("categoriaDonacion", {
        is: "Insumo",
        then: Joi.string().valid("Unica").default("Unica"),
        otherwise: Joi.string().valid("Unica", "Mensual").required().messages({
            "any.only": "La modalidad debe ser 'Unica' o 'Mensual'.",
            "any.required": "Debes seleccionar la modalidad de la donación.",
        }),
    }),
    monto: Joi.when("categoriaDonacion", {
        is: "Dinero",
        then: Joi.number().integer().greater(2000).max(2147483647).required().messages({
            "number.base": "Ingresa un monto válido en pesos chilenos.",
            "number.greater": "El monto de la donación económica debe ser estrictamente mayor a $2.000.",
            "number.integer": "Ingresa un monto entero en pesos chilenos.",
            "any.required": "El monto es obligatorio para donaciones de dinero.",
        }),
        otherwise: Joi.number().integer().min(0).optional().default(0),
    }),
    detalleInsumo: Joi.when("categoriaDonacion", {
        is: "Insumo",
        then: Joi.string().trim().min(3).max(2000).required().messages({
            "string.empty": "Debes especificar qué insumos (alimento, medicinas, mantas, etc.) estás donando.",
            "string.min": "Describe los insumos con al menos 3 caracteres.",
            "any.required": "El detalle del insumo es obligatorio.",
        }),
        otherwise: Joi.string().trim().max(2000).allow("", null).default(null),
    }),
    mensaje: Joi.string().trim().max(2000).allow("", null).default(""),
    animalId: Joi.number().integer().positive().allow(null).default(null),
    aceptaMensual: Joi.boolean().when("modalidad", {
        is: "Mensual",
        then: Joi.valid(true).required().messages({
            "any.only": "Debes autorizar el aporte mensual para continuar.",
            "any.required": "Debes autorizar el aporte mensual para continuar.",
        }),
        otherwise: Joi.optional(),
    }),
}).custom((datos, helpers) => {
    if (datos.categoriaDonacion === "Insumo" && datos.animalId) {
        return helpers.message("El apadrinamiento corresponde únicamente a una suscripción mensual en dinero.");
    }
    if (datos.animalId && datos.modalidad !== "Mensual") {
        return helpers.message("El apadrinamiento corresponde a una suscripción mensual.");
    }
    return datos;
});

export const filtroRecaudacionValidation = Joi.object({
    anio: Joi.number().integer().min(2000).max(9999).required(),
    mes: Joi.number().integer().min(1).max(12).optional(),
    listado: Joi.string().valid("donaciones", "padrinos", "resumen").optional(),
});

export const desactivarValidation = Joi.object({
    motivo: Joi.string().trim().min(3).max(500).required().messages({
        "string.min": "El motivo debe tener al menos 3 caracteres.",
        "any.required": "Indica el motivo de la desactivación.",
    }),
});

export const idValidation = Joi.object({
    id: Joi.number().integer().positive().required().messages({
        "number.base": "El id debe ser un número.",
        "number.positive": "El id debe ser positivo.",
        "any.required": "El id es obligatorio.",
    }),
});
