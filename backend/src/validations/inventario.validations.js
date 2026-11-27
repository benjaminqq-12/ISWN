"use strict";
import Joi from "joi";

export const CATEGORIAS = ["comida", "medico", "limpieza", "oficina"];
export const UNIDADES = ["unidad", "kg", "litro", "paquete"];

const MAX_CANTIDAD = 9999999999.99;

//minimo 4 letras, maximo 2 numeros
//permite unicamente letras, numeros, espacios y guiones
const PATRON_NOMBRE = /^(?=(?:.*\p{L}){5,})(?=(?:\D*\d){0,2}\D*$)[\p{L}\d -]+$/u;

const PATRON_TEXTO = /^(?=.*\p{L})[\p{L}\d -]+$/u;

// Nombre del artículo.
const nombreValidation = Joi.string()
  .trim()
  .min(5)
  .max(120)
  .pattern(PATRON_NOMBRE)
  .required()
  .messages({
    "string.base": "El nombre debe ser un texto.",
    "string.empty": "El nombre no puede estar vacío.",
    "string.min": "El nombre debe contener al menos 5 letras.",
    "string.max": "El nombre no puede superar los 120 caracteres.",
    "string.pattern.base":
      "El nombre debe tener al menos 5 letras, máximo 2 números y solo puede contener letras, espacios y guiones.",
    "any.required": "El nombre del artículo es obligatorio.",
  });

// campo de descripcion q es opcional
const descripcionValidation = Joi.string()
  .trim()
  .max(500)
  .pattern(PATRON_TEXTO)
  .allow(null, "")
  .optional()
  .messages({
    "string.base": "La descripción debe ser un texto.",
    "string.max": "La descripción no puede superar los 500 caracteres.",
    "string.pattern.base":
      "La descripción debe contener letras y solo permite números, espacios y guiones como caracteres adicionales.",
  });

// Valores positivos con un maximo de dos decimales.
const cantidadValidation = Joi.number()
  .min(0.01)
  .max(MAX_CANTIDAD)
  .precision(2)
  .strict()
  .messages({
    "number.base": "La cantidad debe ser un número válido.",
    "number.min": "La cantidad debe ser mayor que cero.",
    "number.max": "La cantidad supera el máximo permitido.",
    "number.precision": "La cantidad puede tener como máximo 2 decimales.",
    "any.required": "La cantidad es obligatoria.",
  });

// el stock inicial y el mínimo deben ser >= 1
const stockValidation = cantidadValidation
  .min(1)
  .messages({
    "number.min": "El stock debe ser como mínimo 1.",
  });

// Campos compartidos por registro y edición.
const camposArticulo = {
  nombre: nombreValidation,

  categoria: Joi.string()
    .valid(...CATEGORIAS)
    .required()
    .messages({
      "any.only": "Debes seleccionar una categoría válida.",
      "any.required": "La categoría es obligatoria.",
    }),

  subcategoria: Joi.when("categoria", {
    is: "comida",
    then: Joi.string()
      .valid("perro", "gato")
      .required()
      .messages({
        "any.only": "Debes seleccionar Perros o Gatos.",
        "any.required": "Debes indicar a qué animales está destinado el alimento.",
      }),
    otherwise: Joi.valid(null).default(null),
  }),

  unidad: Joi.string()
    .valid(...UNIDADES)
    .required()
    .messages({
      "any.only": "Debes seleccionar una unidad de medida válida.",
      "any.required": "La unidad de medida es obligatoria.",
    }),

  descripcion: descripcionValidation,

  stockMinimo: stockValidation
    .required()
    .messages({
      "any.required": "El stock mínimo es obligatorio.",
      "number.min": "El stock mínimo debe ser como mínimo 1.",
    }),
};

// Registrar artículo en inv
export const crearInventarioSchema = Joi.object({
  ...camposArticulo,

  stockInicial: stockValidation
    .required()
    .messages({
      "any.required": "El stock inicial es obligatorio.",
      "number.min": "El stock inicial debe ser como mínimo 1.",
    }),
});

// Editar artículo.
// El formulario actual envía todos los campos editables.
export const editarInventarioSchema = Joi.object({
  ...camposArticulo,
});

// Registrar entrada o salida de inventario.
export const movimientoInventarioSchema = Joi.object({
  tipo: Joi.string()
    .valid("entrada", "salida")
    .required()
    .messages({
      "any.only": "El tipo de movimiento debe ser entrada o salida.",
      "any.required": "Debes seleccionar el tipo de movimiento.",
    }),

  cantidad: cantidadValidation.required(),

  motivo: Joi.string()
    .trim()
    .min(3)
    .max(200)
    .pattern(/\p{L}/u)
    .required()
    .messages({
      "string.base": "El motivo debe ser un texto.",
      "string.empty": "El motivo no puede estar vacío.",
      "string.min": "El motivo debe contener al menos 3 caracteres.",
      "string.max": "El motivo no puede superar los 200 caracteres.",
      "string.pattern.base": "El motivo debe contener al menos una letra.",
      "any.required": "El motivo del movimiento es obligatorio.",
    }),

  // Se utiliza únicamente cuando una salida requiere confirmación.
  confirmarBajoStock: Joi.boolean()
    .strict()
    .default(false),
});

// Validar el identificador del artículo.
export const inventarioIdValidation = Joi.object({
  id: Joi.string()
    .pattern(/^\d+$/)
    .custom((valor, helpers) => {
      const id = Number(valor);

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
      "string.pattern.base": "El ID debe contener únicamente números.",
      "any.invalid": "El ID debe ser un entero positivo válido.",
      "any.required": "El ID del artículo es obligatorio.",
    }),
});

// Validar filtros de consulta.
export const inventarioQueryValidation = Joi.object({
  categoria: Joi.string()
    .valid(...CATEGORIAS)
    .optional()
    .messages({
      "any.only": "La categoría de inventario no está permitida.",
    }),
});

// validacion para eliminar un item y exige confirmacion explicita
export const eliminarInventarioValidation = Joi.object({
  confirmarEliminacion: Joi.boolean()
    .valid(true)
    .strict()
    .required()
    .messages({
      "any.only":
        "Debes confirmar expresamente la eliminación permanente del artículo y su historial.",
      "any.required":
        "Falta la confirmación de eliminación permanente.",
    }),
});

//validacion para eliminar varios items y reutiliza la confirmacion individual
export const eliminarInventarioLoteValidation =
  eliminarInventarioValidation.keys({
    ids: Joi.array()
      .items(
        Joi.number()
          .integer()
          .min(1)
          .max(2147483647)
          .strict()
      )
      .min(1)
      .max(50)
      .unique()
      .required()
      .messages({
        "array.base":
          "Los identificadores deben enviarse como un arreglo.",
        "array.min":
          "Selecciona al menos un artículo.",
        "array.max":
          "No puedes eliminar más de 50 artículos por operación.",
        "array.unique":
          "No se permiten identificadores repetidos.",
        "any.required":
          "Debes indicar los artículos que deseas eliminar.",
      }),
  });