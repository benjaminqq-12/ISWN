"use strict";

import Joi from "joi";
import { ESTADOS_MASCOTA } from "../config/estadosMascota.js";

// Opciones permitidas para los campos de la mascota.
const ESPECIES = ["Perro", "Gato"];
const SEXOS = ["Hembra", "Macho"];

const VIAS_INGRESO = [
  "Entrega voluntaria",
  "Decomiso municipal",
  "Traslado",
  "Hallazgo en vía pública",
];

// Validación del registro de una mascota.
export const mascotaBodyValidation = Joi.object({
  mascota_nombreCompleto: Joi.string()
    .trim()
    .max(100)
    .pattern(/^(?=(?:.*\p{L}){3,})[\p{L}\s-]+$/u)
    .required()
    .messages({
      "string.base": "El nombre debe ser un texto.",
      "string.empty": "El nombre no puede estar vacío.",
      "string.max": "El nombre no debe exceder los 100 caracteres.",
      "string.pattern.base": "El nombre debe componerse de letras.",
      "any.required": "El nombre de la mascota es obligatorio.",
    }),

  mascota_especie: Joi.string()
    .trim()
    .valid(...ESPECIES)
    .required()
    .messages({
      "any.only": "La especie debe ser Perro o Gato.",
      "string.empty": "Debes seleccionar una especie.",
      "any.required": "La especie es obligatoria.",
    }),

  mascota_edad: Joi.number()
    .integer()
    .min(0)
    .max(2147483647)
    .strict()
    .required()
    .messages({
      "number.base": "La edad debe ser un número.",
      "number.integer": "La edad debe ser un número entero.",
      "number.min": "La edad no puede ser negativa.",
      "number.max": "La edad excede el valor permitido.",
      "any.required": "La edad de la mascota es obligatoria.",
    }),

  mascota_peso: Joi.number()
    .greater(0)
    .strict()
    .required()
    .messages({
      "number.base": "El peso debe ser un número.",
      "number.greater": "El peso debe ser mayor que cero.",
      "any.required": "El peso de la mascota es obligatorio.",
    }),

  mascota_sexo: Joi.string()
    .trim()
    .valid(...SEXOS)
    .required()
    .messages({
      "any.only": "El sexo debe ser Hembra o Macho.",
      "string.empty": "Debes seleccionar el sexo.",
      "any.required": "El sexo de la mascota es obligatorio.",
    }),

  mascota_viaIngreso: Joi.string()
    .trim()
    .max(512)
    .valid(...VIAS_INGRESO)
    .required()
    .messages({
      "string.max": "La vía de ingreso no debe exceder los 512 caracteres.",
      "any.only": `La vía de ingreso debe ser una de: ${VIAS_INGRESO.join(", ")}.`,
      "string.empty": "Debes seleccionar una vía de ingreso.",
      "any.required": "La vía de ingreso es obligatoria.",
    }),

  mascota_estado: Joi.string()
    .trim()
    .valid(...ESTADOS_MASCOTA)
    .required()
    .messages({
      "any.only": `El estado debe ser uno de: ${ESTADOS_MASCOTA.join(", ")}.`,
      "string.empty": "Debes seleccionar un estado.",
      "any.required": "El estado de la mascota es obligatorio.",
    }),

  mascota_antecedentesPrevios: Joi.string()
    .trim()
    .max(512)
    .required()
    .messages({
      "string.base": "Los antecedentes deben ser un texto.",
      "string.empty": "Los antecedentes no pueden estar vacíos.",
      "string.max": "Los antecedentes no deben exceder los 512 caracteres.",
      "any.required": "Los antecedentes previos son obligatorios.",
    }),

  mascota_fotoURL: Joi.string()
    .trim()
    .max(512)
    .allow("", null)
    .optional()
    .messages({
      "string.base": "La URL de la foto debe ser un texto.",
      "string.max": "La URL de la foto no debe exceder los 512 caracteres.",
    }),
})
  .required()
  .messages({
    "object.base": "El cuerpo de la solicitud debe ser un objeto.",
    "object.unknown": "El campo {{#label}} no está permitido.",
    "any.required": "Debes enviar los datos de la mascota.",
  });

// Validación para actualización parcial de una mascota.
export const mascotaUpdateValidation = mascotaBodyValidation
  .fork(
    [
      "mascota_nombreCompleto",
      "mascota_especie",
      "mascota_edad",
      "mascota_peso",
      "mascota_sexo",
      "mascota_viaIngreso",
      "mascota_estado",
      "mascota_antecedentesPrevios",
      "mascota_fotoURL",
    ],
    (campo) => campo.optional()
  )
  .min(1)
  .messages({
    "object.min": "Debes enviar al menos un campo para actualizar.",
  });

// Validación del ID recibido por parámetros de URL.
export const mascotaIdValidation = Joi.object({
  id: Joi.string()
    .pattern(/^\d+$/)
    .custom((texto, helpers) => {
      const id = Number(texto);

      if (
        !Number.isSafeInteger(id) ||
        id < 1 ||
        id > 2147483647
      ) {
        return helpers.error("any.invalid");
      }

      return id;
    })
    .required()
    .messages({
      "string.base": "El ID de la mascota no es válido.",
      "string.pattern.base": "El ID debe contener únicamente números enteros positivos.",
      "any.invalid": "El ID debe ser un entero positivo válido.",
      "any.required": "El ID de la mascota es obligatorio.",
    }),
});