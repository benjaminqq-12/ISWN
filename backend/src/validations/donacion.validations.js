import Joi from "joi";

export const donacionBodyValidation = Joi.object({
    categoriaDonacion: Joi.string().valid("Dinero", "Insumo").required().messages({
        "any.only": "La categoría debe ser 'Dinero' o 'Insumo'.",
        "string.empty": "La categoría no puede estar vacía.",
        "any.required": "La categoría de donación es obligatoria."
    }),
    
    // si es dinero exige monto mayor a 2000
    monto: Joi.number().when("categoriaDonacion", {
        is: "Dinero",
        then: Joi.number().greater(2000).required().messages({
            "number.greater": "El monto de la donación económica debe ser estrictamente mayor a 2000 pesos.",
            "number.base": "El monto debe ser un número.",
            "any.required": "El monto es obligatorio para donaciones de dinero."
        }),
        otherwise: Joi.optional()
    }),
    
    // si es insumo exige detalle
    detalleInsumo: Joi.string().when("categoriaDonacion", {
        is: "Insumo",
        then: Joi.string().trim().min(1).required().messages({
            "string.empty": "Debe especificar qué insumos (comida, medicinas, etc.) está donando.",
            "any.required": "El detalle del insumo es obligatorio."
        }),
        otherwise: Joi.optional()
    }),
    
    apadrinado: Joi.boolean().optional().messages({
        "boolean.base": "Apadrinado debe ser verdadero o falso."
    }),
    
    animalId: Joi.number().integer().positive().optional().messages({
        "number.base": "El id del animal debe ser un número válido.",
        "number.positive": "El id del animal debe ser positivo."
    })
});