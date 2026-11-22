import Joi from "joi";
import { ROLES_CREABLES_POR_ADMIN } from "../config/roles.js";

// valida el formato y el dígito verificador de un RUT chileno (sin puntos, con guion)
function rutValido(valor) {
  const m = /^(\d{7,8})-([\dK])$/.exec(valor);
  if (!m) return false;

  let suma = 0;
  let factor = 2;
  for (let i = m[1].length - 1; i >= 0; i--) {
    suma += Number(m[1][i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const resto = 11 - (suma % 11);
  const dv = resto === 11 ? "0" : resto === 10 ? "K" : String(resto);
  return dv === m[2];
}

const campos = {
  rut: Joi.string().trim().custom((value, helpers) => {
    // se guarda sin puntos y con la K en mayúscula
    const normalizado = value.replace(/\./g, "").toUpperCase();
    return rutValido(normalizado) ? normalizado : helpers.error("rut.invalido");
  }).required().messages({
    "string.empty": "El RUT no puede estar vacío.",
    "rut.invalido": "Ingresa un RUT válido (ej: 12345678-5).",
    "any.required": "El RUT es obligatorio."
  }),
  usuarioNombre: Joi.string().trim().min(2).max(100).required().messages({
    "string.empty": "El nombre no puede estar vacío.",
    "string.min": "El nombre debe tener al menos 2 caracteres.",
    "string.max": "El nombre no debe exceder los 100 caracteres.",
    "any.required": "El nombre es obligatorio."
  }),
  usuarioEmail: Joi.string().trim().email({ tlds: { allow: false } }).max(100).required().messages({
    "string.empty": "El correo no puede estar vacío.",
    "string.email": "Ingresa un correo electrónico válido.",
    "string.max": "El correo no debe exceder los 100 caracteres.",
    "any.required": "El correo es obligatorio."
  }),
  usuarioPassword: Joi.string().min(8).max(72).required().messages({
    "string.empty": "La contraseña no puede estar vacía.",
    "string.min": "La contraseña debe tener al menos 8 caracteres.",
    "string.max": "La contraseña no debe exceder los 72 caracteres.",
    "any.required": "La contraseña es obligatoria."
  }),
};

const mensajeCampoNoPermitido = {
  "object.unknown": "El campo {#label} no está permitido.",
};

// registro público: el rol nunca viene del cliente
export const registroUsuarioBodyValidation = Joi.object({
  ...campos,
}).messages(mensajeCampoNoPermitido);

// creación por un administrador: elige el rol entre los permitidos
export const crearUsuarioBodyValidation = Joi.object({
  ...campos,
  rol: Joi.string().valid(...ROLES_CREABLES_POR_ADMIN).required().messages({
    "any.only": `El rol debe ser uno de: ${ROLES_CREABLES_POR_ADMIN.join(", ")}.`,
    "string.empty": "El rol no puede estar vacío.",
    "any.required": "El rol es obligatorio."
  }),
}).messages(mensajeCampoNoPermitido);