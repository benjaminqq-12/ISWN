"use strict";
import { AppDataSource } from "../config/configDb.js";
import InventarioSchema from "../entity/inventario.entity.js";
import MovimientoInventarioSchema from "../entity/movimientoInventario.entity.js";

// Se añade status solo para distinguir 404/409 de errores de servidor.
const fallo = (status, message) => ({ status, message });
function errorServidor(operacion, error) {
  console.error(`Error en inventario (${operacion}):`, error);
  return [null, fallo(500, "Error interno del servidor")];
}

export async function listarInventarioService(categoria) {
  try {
    const articulos = await AppDataSource.getRepository(InventarioSchema).find({
      where: categoria ? { categoria } : {},
      order: { categoria: "ASC", nombre: "ASC" },
    });
    return [articulos, null];
  } catch (error) {
    return errorServidor("listar", error);
  }
}

export async function obtenerItemInventarioService(id) {
  try {
    const item = await AppDataSource.getRepository(InventarioSchema).findOneBy({ inventarioId: id });
    return item ? [item, null] : [null, fallo(404, "Artículo no encontrado")];
  } catch (error) {
    return errorServidor("obtener", error);
  }
}

export async function crearItemInventarioService(datos, usuarioId) {
  const { stockInicial, ...campos } = datos;
  try {
    // El stock inicial también se indica, en la misma transacción que la creación.
    const item = await AppDataSource.transaction(async (manager) => {
      const inventario = manager.getRepository(InventarioSchema);
      const guardado = await inventario.save(inventario.create({ ...campos, stock: stockInicial }));
      if (stockInicial > 0) {
        const movimientos = manager.getRepository(MovimientoInventarioSchema);
        await movimientos.save(movimientos.create({
          inventario: { inventarioId: guardado.inventarioId },
          usuario: { usuarioId },
          tipo: "entrada",
          cantidad: stockInicial,
          motivo: "Stock inicial",
        }));
      }
      return guardado;
    });
    return [item, null];
  } catch (error) {
    return errorServidor("crear", error);
  }
}

export async function editarItemInventarioService(id, datos) {
  try {
    const inventario = AppDataSource.getRepository(InventarioSchema);
    // UPDATE parcial: un guardado de entidad completa podría reescribir el stock
    // concurrentemente modificado por otro usuario.
    const resultado = await inventario.update({ inventarioId: id }, datos);
    if (!resultado.affected) return [null, fallo(404, "Artículo no encontrado")];
    const item = await inventario.findOneBy({ inventarioId: id });
    return [item, null];
  } catch (error) {
    return errorServidor("editar", error);
  }
}

export async function registrarMovimientoInventarioService(id, datos, usuarioId) {
  const { tipo, cantidad, motivo } = datos;
  const delta = (tipo === "salida" ? -cantidad : cantidad).toFixed(2);

  try {
    // UPDATE condicional atómico. Evita stock negativo incluso bajo concurrencia.
    // Registro de movimiento y actualización quedan en la MISMA transacción.
    return await AppDataSource.transaction(async (manager) => {
      const actualizados = await manager.query(
        `UPDATE "Inventario"
         SET "stock" = "stock" + $1::numeric, "actualizadoEn" = NOW()
         WHERE "inventarioId" = $2
           AND "stock" + $1::numeric BETWEEN 0 AND 9999999999.99
         RETURNING "inventarioId", "stock"`,
        [delta, id],
      );
      if (actualizados.length === 0) {
        const existe = await manager.getRepository(InventarioSchema).exist({
          where: { inventarioId: id },
        });
        return [null, existe
          ? fallo(409, "El movimiento excede el stock disponible")
          : fallo(404, "Artículo no encontrado")];
      }
      const repository = manager.getRepository(MovimientoInventarioSchema);
      const movimiento = await repository.save(repository.create({
        inventario: { inventarioId: id },
        usuario: { usuarioId },
        tipo,
        cantidad,
        motivo,
      }));
      return [{ movimiento, stockActual: actualizados[0].stock }, null];
    });
  } catch (error) {
    return errorServidor("registrar movimiento", error);
  }
}

export async function listarMovimientosInventarioService(id) {
  try {
    const inventario = AppDataSource.getRepository(InventarioSchema);
    const existe = await inventario.exist({ where: { inventarioId: id } });
    if (!existe) return [null, fallo(404, "Artículo no encontrado")];
    const movimientos = await AppDataSource.getRepository(MovimientoInventarioSchema).find({
      where: { inventario: { inventarioId: id } },
      relations: { usuario: true },
      order: { fecha: "DESC", movimientoId: "DESC" },
      take: 100,
    });
    // Nunca exponer usuarioPassword ni otros datos privados de Usuario.
    return [movimientos.map((m) => ({
      movimientoId: m.movimientoId,
      tipo: m.tipo,
      cantidad: m.cantidad,
      motivo: m.motivo,
      fecha: m.fecha,
      responsable: m.usuario?.usuarioNombre ?? "Sin información",
    })), null];
  } catch (error) {
    return errorServidor("listar movimientos", error);
  }
}