"use strict";
import Joi from "joi";

export const CATEGORIAS = ["comida", "medico", "limpieza", "oficina"];
export const UNIDADES = ["unidad", "kg", "litro", "paquete"];

const cantidad = Joi.number().min(0).max(9999999999.99).precision(2).strict();
const base = {
  nombre: Joi.string().trim().min(2).max(120).required(),
  categoria: Joi.string().valid(...CATEGORIAS).required(),
  subcategoria: Joi.when("categoria", {
    is: "comida",
    then: Joi.string().valid("perro", "gato").required(),
    otherwise: Joi.valid(null).default(null),
  }),
  unidad: Joi.string().valid(...UNIDADES).required(),
  descripcion: Joi.string().trim().allow("", null).max(500).default(null),
  stockMinimo: cantidad.required(),
};

export const crearInventarioSchema = Joi.object({
  ...base,
  stockInicial: cantidad.required(),
});
export const editarInventarioSchema = Joi.object(base);
export const movimientoInventarioSchema = Joi.object({
  tipo: Joi.string().valid("entrada", "salida").required(),
  cantidad: cantidad.greater(0).required(),
  motivo: Joi.string().trim().min(3).max(200).required(),
});

export function validar(schema, body) {
  const { error, value } = schema.validate(body, { abortEarly: false, stripUnknown: false });
  if (error) return { error: error.details.map((detalle) => detalle.message).join("; ") };
  return { value };
}
