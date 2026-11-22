
"use strict";

import { AppDataSource } from "../config/configDb.js";
import VoluntarioSchema from "../entity/voluntario.entity.js";

export async function obtenerSolicitudesPendientes() {
  const repositorio = AppDataSource.getRepository(VoluntarioSchema);

  const solicitudes = await repositorio.find({
    where: {
      estado: "Pendiente",
    },
    order: {
      fechaRegistro: "DESC",
    },
  });

  return solicitudes;
}

export async function cambiarEstadoSolicitud(id, nuevoEstado) {
  const repositorio = AppDataSource.getRepository(VoluntarioSchema);

  const estadosPermitidos = ["Aprobado", "Rechazado"];

  if (!estadosPermitidos.includes(nuevoEstado)) {
    return {
      error: "ESTADO_INVALIDO",
    };
  }

  // Solo permite modificar solicitudes pendientes.
  const resultado = await repositorio
    .createQueryBuilder()
    .update()
    .set({ estado: nuevoEstado })
    .where("voluntarioId = :id", { id })
    .andWhere("estado = :estado", { estado: "Pendiente" })
    .execute();

  if (resultado.affected === 1) {
    // Recuperamos los datos para enviar la notificación.
    const voluntario = await repositorio.findOne({
      where: { voluntarioId: id },
    });

    return {
      actualizado: true,
      estado: nuevoEstado,
      voluntario: {
        nombreCompleto: voluntario.nombreCompleto,
        email: voluntario.email,
      },
    };
  }

  const solicitud = await repositorio.findOne({
    where: { voluntarioId: id },
  });

  if (!solicitud) {
    return {
      error: "NO_ENCONTRADA",
    };
  }

  return {
    error: "YA_PROCESADA",
  };
}
