import api from "./root.service.js";

const auth = (token) => ({ headers: { Authorization: `Bearer ${token}` } });

function obtenerDatos(respuesta) {
  return respuesta.data.data;
}

export async function listarInventario(token, categoria = "") {
  const respuesta = await api.get("/inventario", {
    ...auth(token),
    params: categoria ? { categoria } : undefined,
  });
  return obtenerDatos(respuesta);
}

export async function obtenerItemInventario(token, id) {
  return obtenerDatos(await api.get(`/inventario/${id}`, auth(token)));
}

export async function crearItemInventario(token, datos) {
  return obtenerDatos(await api.post("/inventario", datos, auth(token)));
}

export async function editarItemInventario(token, id, datos) {
  return obtenerDatos(await api.put(`/inventario/${id}`, datos, auth(token)));
}

export async function registrarMovimiento(token, id, datos) {
  return obtenerDatos(await api.post(`/inventario/${id}/movimientos`, datos, auth(token)));
}

export async function listarMovimientos(token, id) {
  return obtenerDatos(await api.get(`/inventario/${id}/movimientos`, auth(token)));
}

export function mensajeErrorInventario(error) {
  if (error.response?.status === 401) return "Tu sesión expiró. Vuelve a iniciar sesión.";
  if (error.response?.status === 403) return "No tienes permisos para acceder al inventario.";
  const detalle = error.response?.data?.details;
  if (typeof detalle === "string" && detalle) {
    return `${error.response?.data?.message || "Datos inválidos"}: ${detalle}`;
  }
  return error.response?.data?.message || error.message || "No se pudo completar la operación.";
}
