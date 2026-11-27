"use strict";
import { handleSuccess, handleErrorClient, handleErrorServer } from "../handlers/responseHandlers.js";

import {
  listarInventarioService,
  obtenerItemInventarioService,
  crearItemInventarioService,
  editarItemInventarioService,
  registrarMovimientoInventarioService,
  listarMovimientosInventarioService,
  eliminarItemsInventarioService,
} from "../services/inventario.service.js";
import {
  CATEGORIAS,
  crearInventarioSchema, 
  editarInventarioSchema, 
  movimientoInventarioSchema,
  inventarioIdValidation,
  inventarioQueryValidation,
  eliminarInventarioValidation,
  eliminarInventarioLoteValidation,
} from "../validations/inventario.validations.js";

// Los controladores, como los de Mascotas, validan la solicitud y traducen
// [datos, error] de la capa de servicio a respuestas HTTP comunes del proyecto.
function obtenerIdInventario(req, res) {
  const { error, value } = inventarioIdValidation.validate(req.params);
  if (error) {
    handleErrorClient(res, 400, error.details[0].message);
    return null;
  }
  return value.id;
}
  
//transforma los errores del service en respuestas HTTP 
function responderError(res, error) {
  if (error.status >= 500) return handleErrorServer(res, error.status, error.message);
  return handleErrorClient(res, error.status, error.message, error.details ?? {});
}

//formatea los mensajes devueltos por joi 
function responderValidacion(res, error) {
  return handleErrorClient(res, 400, "Datos inválidos", error.details.map((detalle) => detalle.message).join("; "));
}

//consultar inventario
export async function listarInventario(req, res) {
  const { error, value } = inventarioQueryValidation.validate(req.query);
  if (error) return responderValidacion(res, error);
  
  const [items, fallo] = await listarInventarioService(value.categoria);
  if (fallo) return responderError(res, fallo);
  return handleSuccess(res, 200, "Inventario obtenido", items);
}

//consultar item por id
export async function obtenerItemInventario(req, res) {
  const id = obtenerIdInventario(req, res);
  if (id === null) return;
  const [item, error] = await obtenerItemInventarioService(id);
  if (error) return responderError(res, error);
  return handleSuccess(res, 200, "Artículo obtenido", item);
}

//registrar item
export async function crearItemInventario(req, res) {
  const { error, value } = crearInventarioSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) return responderValidacion(res, error);
 
  const [item, fallo] = await crearItemInventarioService(value, req.user.usuarioId);
  if (fallo) return responderError(res, fallo);
  return handleSuccess(res, 201, "Artículo registrado", item);
}

//editar item
export async function editarItemInventario(req, res) {
  const id = obtenerIdInventario(req, res);
  if (id === null) return;
  const {error, value} = editarInventarioSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) return responderValidacion(res, error);
  const [item, fallo] = await editarItemInventarioService(id, value);
  if (fallo) return responderError(res, fallo);
  return handleSuccess(res, 200, "Artículo actualizado", item);
}

export async function registrarMovimientoInventario(req, res) {
  const id = obtenerIdInventario(req, res);
  if (id === null) return;
  const {error, value} = movimientoInventarioSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) return responderValidacion(res, error);
  const [movimiento, fallo] = await registrarMovimientoInventarioService(id, value, req.user.usuarioId);
  if (fallo) return responderError(res, fallo);
  return handleSuccess(res, 201, "Movimiento registrado", movimiento);
}

export async function listarMovimientosInventario(req, res) {
  const id = obtenerIdInventario(req, res);
  if (id === null) return;
  const [movimientos, error] = await listarMovimientosInventarioService(id);
  if (error) return responderError(res, error);
  return handleSuccess(res, 200, "Movimientos obtenidos (últimos 100)", movimientos);
}

export async function eliminarItemInventario(req, res) {
  const id = obtenerIdInventario(req, res);
  if (id === null) return;
  const { error } = eliminarInventarioValidation.validate(req.body ?? {});
  if  (error) return responderValidacion(res, error);
  const [resultado, fallo] = await eliminarItemsInventarioService([id]);
  if (fallo) return responderError(res, fallo);
  return handleSuccess(res, 200, "Artículo e historial eliminados permanentemente", resultado);
}

export async function eliminarItemsInventario(req, res) {
  const { error, value } = eliminarInventarioLoteValidation.validate(req.body ?? {} , {abortEarly: false,});
  if (error) return responderValidacion(res, error);
  const [resultado, fallo] = await eliminarItemsInventarioService(value.ids);
  if (fallo) return responderError(res, fallo);
  return handleSuccess(res, 200,  `Se eliminaron ${resultado.cantidadEliminada} artículos y ${resultado.cantidadMovimientosEliminados} movimientos de su historial.`, resultado);
}