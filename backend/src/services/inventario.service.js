"use strict";
import { AppDataSource } from "../config/configDb.js";
import InventarioSchema from "../entity/inventario.entity.js";
import MovimientoInventarioSchema from "../entity/movimientoInventario.entity.js";

// Se añade status solo para distinguir 404/409 de errores de servidor.
const fallo = (status, message, details = {}) => ({ status, message, details });

function errorServidor(operacion, error) {
  console.error(`Error en inventario (${operacion}):`, error);
  return [null, fallo(500, "Error interno del servidor")];
}

function aCentavos(valor) {
  const [entero, decimal = ""] = String(valor).split(".");
  return Number(entero) * 100 + Number((decimal + "00").slice(0,2));
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
      const movimiento = manager.getRepository(MovimientoInventarioSchema);
      await movimiento.save(movimiento.create({
        inventario: { inventarioId: guardado.inventarioId },
        usuario: { usuarioId },
        tipo: "entrada",
        cantidad: stockInicial,
        motivo: "Stock inicial",
      }));
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
  const { tipo, cantidad, motivo, confirmarBajoStock = false } = datos;
  const delta = (tipo === "salida" ? -cantidad : cantidad).toFixed(2);

  try {
    return await AppDataSource.transaction(async (manager) => {

      // Bloquear el artículo durante la operación.
      const filas = await manager.query(
        `SELECT "stock", "stockMinimo", "unidad"
         FROM "Inventario"
         WHERE "inventarioId" = $1
         FOR UPDATE`,
        [id]
      );

      if (filas.length === 0) {
        return [null, fallo(404, "Artículo no encontrado")];
      }

      const articulo = filas[0];

      const stockCentavos = aCentavos(articulo.stock);
      const minimoCentavos = aCentavos(articulo.stockMinimo);
      const cantidadCentavos = aCentavos(cantidad);

      // Reglas específicas para las salidas.
      if (tipo === "salida") {

        // No permitir retirar más de lo disponible.
        if (cantidadCentavos > stockCentavos) {
          return [
            null,
            fallo(
              409,
              `No se cuenta con stock suficiente para realizar la salida. Disponible: ${articulo.stock} ${articulo.unidad}.`,
              {
                codigo: "STOCK_INSUFICIENTE",
                stockActual: articulo.stock,
                stockMinimo: articulo.stockMinimo,
              }
            ),
          ];
        }

        const restanteCentavos =
          stockCentavos - cantidadCentavos;

        // Solicitar confirmación si queda stock mínimo,
        // bajo el mínimo o se agota completamente.
        if (
          restanteCentavos <= minimoCentavos &&
          !confirmarBajoStock
        ) {
          const mensaje = restanteCentavos === 0
            ? "Esta salida dejará el artículo sin stock. ¿Deseas continuar?"
            : restanteCentavos === minimoCentavos
              ? "Esta salida dejará el artículo exactamente en su stock mínimo. ¿Deseas continuar?"
              : "Esta salida dejará el artículo por debajo de su stock mínimo. ¿Deseas continuar?";

          return [
            null,
            fallo(409, mensaje, {
              codigo: "CONFIRMACION_REQUERIDA",
              stockActual: articulo.stock,
              stockMinimo: articulo.stockMinimo,
              stockRestante: (
                restanteCentavos / 100
              ).toFixed(2),
            }),
          ];
        }
      }

      // Actualizar existencias dentro de la transacción.
      const delta = tipo === "salida"
        ? `-${cantidad}`
        : String(cantidad);

      const actualizados = await manager.query(
        `UPDATE "Inventario"
         SET "stock" = "stock" + $1::numeric,
             "actualizadoEn" = NOW()
         WHERE "inventarioId" = $2
           AND "stock" + $1::numeric
               BETWEEN 0 AND 9999999999.99
         RETURNING "stock"`,
        [delta, id]
      );

      if (actualizados.length === 0) {
        return [
          null,
          fallo(
            409,
            "El movimiento supera el límite permitido de existencias"
          ),
        ];
      }

      // Guardar el historial del movimiento.
      const repository =
        manager.getRepository(MovimientoInventarioSchema);

      const movimiento = await repository.save(
        repository.create({
          inventario: { inventarioId: id },
          usuario: { usuarioId },
          tipo,
          cantidad,
          motivo,
        })
      );

      return [
        {
          movimiento,
          stockActual: actualizados[0].stock,
        },
        null,
      ];
    });

  } catch (error) {
    return errorServidor("registrar movimiento", error);
  }
}

export async function listarMovimientosInventarioService(id) {
  try {
    const inventario = AppDataSource.getRepository(InventarioSchema);
    const existe = await inventario.exists({ where: { inventarioId: id } });
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