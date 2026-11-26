"use strict";

import Joi from "joi";

// Áreas de interés disponibles en el formulario.
export const AREAS_INTERES = [
    "Manejo de perros",
    "Manejo de gatos",
    "Alimentación",
    "Limpieza",
    "Transporte",
    "Apoyo en eventos",
    "Seguimiento de adopciones",
    "Primeros auxilios",
    "Apoyo veterinario",
];

// Días permitidos para la disponibilidad.
export const DIAS = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
];

// Validación del RUT chileno mediante módulo 11.
function validarRut(valor, helpers) {
    const limpio = valor.replace(/[.-]/g, "").toUpperCase();

    if (!/^\d{7,8}[\dK]$/.test(limpio)) {
        return helpers.error("any.invalid");
    }

    const cuerpo = limpio.slice(0, -1);
    const digitoIngresado = limpio.slice(-1);

    let suma = 0;
    let multiplicador = 2;

    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += Number(cuerpo[i]) * multiplicador;
        multiplicador = multiplicador === 7
            ? 2
            : multiplicador + 1;
    }

    const resultado = 11 - (suma % 11);

    const digitoCalculado =
        resultado === 11
            ? "0"
            : resultado === 10
                ? "K"
                : String(resultado);

    if (digitoIngresado !== digitoCalculado) {
        return helpers.error("any.invalid");
    }

    // Mantener el mismo formato utilizado por el frontend.
    const cuerpoFormateado = cuerpo.replace(
        /\B(?=(\d{3})+(?!\d))/g,
        "."
    );

    return `${cuerpoFormateado}-${digitoCalculado}`;
}

// Validación de nombres.
const nombreSchema = Joi.string()
    .trim()
    .min(2)
    .max(120)
    .pattern(/^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u)
    .required()
    .messages({
        "string.empty": "El nombre no puede estar vacío.",
        "string.min": "El nombre debe tener al menos 2 caracteres.",
        "string.max": "El nombre no puede superar los 120 caracteres.",
        "string.pattern.base": "El nombre no puede contener números ni símbolos inválidos.",
        "string.base": "El nombre debe ser un texto.",
        "any.required": "El nombre es obligatorio.",
    });

// Validación del teléfono móvil chileno.
const telefonoSchema = Joi.string()
    .trim()
    .pattern(/^\+569\d{8}$/)
    .required()
    .messages({
        "string.pattern.base": "El teléfono debe comenzar con +569 y contener 8 dígitos adicionales.",
        "string.empty": "El teléfono no puede estar vacío.",
        "string.base": "El teléfono debe ser un texto.",
        "any.required": "El teléfono es obligatorio.",
    });

// Validación del correo electrónico.
export const correoSchema = Joi.string()
    .trim()
    .lowercase()
    .max(120)
    .email({ tlds: { allow: false } })
    .required()
    .messages({
        "string.email": "Ingresa un correo electrónico válido.",
        "string.max": "El correo no puede superar los 120 caracteres.",
        "string.empty": "El correo no puede estar vacío.",
        "string.base": "El correo debe ser un texto.",
        "any.required": "El correo electrónico es obligatorio.",
    });

// Validación de horarios en formato HH:mm.
const horaSchema = Joi.string()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d$/);

// Validación de disponibilidad de un día.
const diaSchema = Joi.object({
    disponible: Joi.boolean()
        .strict()
        .required(),

    desde: Joi.when("disponible", {
        is: true,
        then: horaSchema.required(),
        otherwise: horaSchema.allow("").default(""),
    }),

    hasta: Joi.when("disponible", {
        is: true,
        then: horaSchema.required(),
        otherwise: horaSchema.allow("").default(""),
    }),
})
    .custom((valor, helpers) => {
        if (
            valor.disponible &&
            valor.desde >= valor.hasta
        ) {
            return helpers.error("any.invalid");
        }

        return valor;
    })
    .messages({
        "any.invalid": "La hora de inicio debe ser anterior a la hora de término.",
        "string.pattern.base": "El horario debe tener formato HH:mm.",
    });

// Esquema principal del registro de voluntarios.
export const crearVoluntarioSchema = Joi.object({

    // Información personal.
    nombreCompleto: nombreSchema,

    rut: Joi.string()
        .trim()
        .max(12)
        .pattern(/^(?:\d{1,2}\.\d{3}\.\d{3}-[\dkK]|\d{7,8}-?[\dkK])$/)
        .custom(validarRut)
        .required()
        .messages({
            "string.empty": "El RUT no puede estar vacío.",
            "string.max": "El RUT no puede superar los 12 caracteres.",
            "string.pattern.base": "El formato del RUT no es válido.",
            "any.invalid": "El dígito verificador del RUT no es válido.",
            "any.required": "El RUT es obligatorio.",
        }),

    fechaNacimiento: Joi.string()
        .pattern(/^\d{4}-\d{2}-\d{2}$/)
        .custom((valor, helpers) => {
            const fecha = new Date(`${valor}T00:00:00Z`);

            if (
                Number.isNaN(fecha.getTime()) ||
                fecha.toISOString().slice(0, 10) !== valor
            ) {
                return helpers.error("any.invalid");
            }

            const hoy = new Date();
            const fechaLocal = [
                hoy.getFullYear(),
                String(hoy.getMonth() + 1).padStart(2, "0"),
                String(hoy.getDate()).padStart(2, "0"),
            ].join("-");

            if (valor > fechaLocal) {
                return helpers.error("any.invalid");
            }

            return valor;
        })
        .allow(null, "")
        .default(null)
        .messages({
            "any.invalid": "La fecha de nacimiento debe ser válida y no puede ser futura.",
            "string.pattern.base": "La fecha debe tener formato AAAA-MM-DD.",
        }),

    telefono: telefonoSchema,

    email: correoSchema,

    direccion: Joi.string()
        .trim()
        .min(2)
        .max(200)
        .required()
        .messages({
            "string.empty": "La dirección no puede estar vacía.",
            "string.min": "La dirección debe tener al menos 2 caracteres.",
            "string.max": "La dirección no puede superar los 200 caracteres.",
            "any.required": "La dirección es obligatoria.",
        }),

    // Contacto de emergencia.
    contactoEmergencia: Joi.object({
        nombre: nombreSchema,

        parentesco: Joi.string()
            .trim()
            .min(2)
            .max(50)
            .pattern(/^[\p{L}\p{M}][\p{L}\p{M} /.'-]*$/u)
            .required()
            .messages({
                "string.empty": "El parentesco no puede estar vacío.",
                "string.pattern.base": "El parentesco no puede contener números ni símbolos inválidos.",
                "string.max": "El parentesco no puede superar los 50 caracteres.",
                "any.required": "El parentesco es obligatorio.",
            }),

        telefono: telefonoSchema,

    }).required(),

    // Áreas de interés.
    areasInteres: Joi.array()
        .items(Joi.string().valid(...AREAS_INTERES))
        .unique()
        .max(AREAS_INTERES.length)
        .default([])
        .messages({
            "array.base": "Las áreas de interés deben enviarse como un arreglo.",
            "array.unique": "Las áreas de interés no pueden repetirse.",
        }),

    // Disponibilidad semanal.
    disponibilidad: Joi.object(
        Object.fromEntries(
            DIAS.map((dia) => [dia, diaSchema])
        )
    ).default({}),

    // Información de transporte.
    transporte: Joi.object({

        disponibleTraslados: Joi.boolean()
            .strict()
            .default(false),

        poseeVehiculo: Joi.boolean()
            .strict()
            .default(false),

        tipoVehiculo: Joi.string()
            .trim()
            .max(80)
            .allow("", null)
            .default(null),

    }).default({
        disponibleTraslados: false,
        poseeVehiculo: false,
        tipoVehiculo: null,
    }),

    // Estos campos se reciben por compatibilidad con el
    // frontend, pero no se utilizan para asignar permisos
    // ni modificar el estado inicial de la postulación.
    estado: Joi.any().strip(),

    observaciones: Joi.any().strip(),

}).required();

// Esquema para el endpoint de verificación de correo.
export const verificarCorreoSchema = Joi.object({
    email: correoSchema,
}).required();

// Función general de validación.
// Mantiene la estructura utilizada por el equipo.
export function validar(schema, body) {
    const { error, value } = schema.validate(body, {
        abortEarly: false,
        stripUnknown: false,
    });

    if (error) {
        return {
            error: error.details
                .map((detalle) => detalle.message)
                .join("; "),
        };
    }

    return { value };
}