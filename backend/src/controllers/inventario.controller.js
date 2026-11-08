"use strict";
import { handleSuccess, handleErrorClient, handleErrorServer } from "../handlers/responseHandlers.js";
import {
  CATEGORIAS, crearInventarioSchema, editarInventarioSchema,
  movimientoInventarioSchema, validar,
} from "../validations/inventario.validations.js";
import {
  listarInventarioService,
  obtenerItemInventarioService,
  crearItemInventarioService,
  editarItemInventarioService,
  registrarMovimientoInventarioService,
  listarMovimientosInventarioService,
} from "../services/inventario.service.js";

// Los controladores, como los de Mascotas, validan la solicitud y traducen
// [datos, error] de la capa de servicio a respuestas HTTP comunes del proyecto.
function obtenerIdInventario(req, res) {
  const texto = req.params.id;
  const id = Number(texto);
  if (typeof texto !== "string" || !/^\d+$/.test(texto) || !Number.isSafeInteger(id) || id < 1 || id > 2147483647) {
    handleErrorClient(res, 400, "El ID del artículo debe ser un entero positivo válido");
    return null;
  }
  return id;
}

function responderError(res, error) {
  if (error.status >= 500) return handleErrorServer(res, error.status, error.message);
  return handleErrorClient(res, error.status, error.message);
}

export async function listarInventario(req, res) {
  const { categoria } = req.query;
  if (categoria !== undefined && (typeof categoria !== "string" || !CATEGORIAS.includes(categoria))) {
    return handleErrorClient(res, 400, "Categoría de inventario no permitida");
  }
  const [items, error] = await listarInventarioService(categoria);
  if (error) return responderError(res, error);
  return handleSuccess(res, 200, "Inventario obtenido", items);
}

export async function obtenerItemInventario(req, res) {
  const id = obtenerIdInventario(req, res);
  if (id === null) return;
  const [item, error] = await obtenerItemInventarioService(id);
  if (error) return responderError(res, error);
  return handleSuccess(res, 200, "Artículo obtenido", item);
}

export async function crearItemInventario(req, res) {
  const datos = validar(crearInventarioSchema, req.body);
  if (datos.error) return handleErrorClient(res, 400, "Datos inválidos", datos.error);
  const [item, error] = await crearItemInventarioService(datos.value, req.user.usuarioId);
  if (error) return responderError(res, error);
  return handleSuccess(res, 201, "Artículo registrado", item);
}

export async function editarItemInventario(req, res) {
  const id = obtenerIdInventario(req, res);
  if (id === null) return;
  const datos = validar(editarInventarioSchema, req.body);
  if (datos.error) return handleErrorClient(res, 400, "Datos inválidos", datos.error);
  const [item, error] = await editarItemInventarioService(id, datos.value);
  if (error) return responderError(res, error);
  return handleSuccess(res, 200, "Artículo actualizado", item);
}

export async function registrarMovimientoInventario(req, res) {
  const id = obtenerIdInventario(req, res);
  if (id === null) return;
  const datos = validar(movimientoInventarioSchema, req.body);
  if (datos.error) return handleErrorClient(res, 400, "Datos inválidos", datos.error);
  const [movimiento, error] = await registrarMovimientoInventarioService(id, datos.value, req.user.usuarioId);
  if (error) return responderError(res, error);
  return handleSuccess(res, 201, "Movimiento registrado", movimiento);
}

export async function listarMovimientosInventario(req, res) {
  const id = obtenerIdInventario(req, res);
  if (id === null) return;
  const [movimientos, error] = await listarMovimientosInventarioService(id);
  if (error) return responderError(res, error);
  return handleSuccess(res, 200, "Movimientos obtenidos (últimos 100)", movimientos);
}
