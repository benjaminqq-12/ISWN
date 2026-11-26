
"use strict";

import { AppDataSource } from "../config/configDb.js";
import MascotaSchema from "../entity/mascota.entity.js";
import { ESTADO_MASCOTA } from "../config/estadosMascota.js";
import { createHash } from "node:crypto";

const RELACIONES_LOTE = [
  // Registros que bloquean la eliminación.
  {
    entidad: "AtencionMedica",
    relacion: "mascota",
    idRegistro: "atencion_id",
    nombre: "Atenciones médicas",
    tipo: "protegida",
  },
  {
    entidad: "Donacion",
    relacion: "animal",
    idRegistro: "donacionId",
    nombre: "Donaciones",
    tipo: "protegida",
  },
  {
    entidad: "SuscripcionDonacion",
    relacion: "animal",
    idRegistro: "suscripcionId",
    nombre: "Suscripciones de donación",
    tipo: "protegida",
  },
  {
    entidad: "SolicitudEstado",
    relacion: "mascota",
    idRegistro: "solicitudEstadoId",
    nombre: "Solicitudes de cambio de estado",
    tipo: "protegida",
  },

  // Registros cuya eliminación depende de CASCADE.
  {
    entidad: "HistorialMascota",
    relacion: "historialAdopcion_mascota",
    idRegistro: "historialMascota_id",
    nombre: "Historial de mascota",
    tipo: "cascada",
  },
  {
    entidad: "CalendarioSanidad",
    relacion: "calendarioSanidad_mascota",
    idRegistro: "calendarioSanidad_id",
    nombre: "Calendario sanitario",
    tipo: "cascada",
  },
  {
    entidad: "SolicitudAdopcion",
    relacion: "solicitudAdopcion_mascotaAdoptada",
    idRegistro: "solicitudAdopcion_id",
    nombre: "Solicitudes de adopción",
    tipo: "cascada",
  },
  {
    entidad: "Vacuna",
    relacion: "mascota",
    idRegistro: "vacuna_id",
    nombre: "Vacunas",
    tipo: "cascada",
  },
  {
    entidad: "HistorialClinico",
    relacion: "historialClinico_mascota",
    idRegistro: "historialClinico_id",
    nombre: "Historial clínico",
    tipo: "cascada",
  },
];

function errorLote(statusCode, message, details = {}) {
  return Object.assign(new Error(message), {statusCode, details,});
}

function normalizarErrorLote(error) {
  if (error.statusCode) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      details: error.details,
    };
  }

  if (
    error.code === "23503" ||
    error.driverError?.code === "23503"
  ) {
    return {
      statusCode: 409,
      message:
        "Existe otra relación que impide eliminar una mascota. No se eliminó ninguna.",
      details: {
        codigo: "RELACION_NO_PREVISTA",
      },
    };
  }

  console.error("Error al procesar lote:", error);

  return {
    statusCode: 500,
    message: "Error interno al procesar el lote.",
    details: {},
  };
}

function crearErrorLote(statusCode, mensaje, details = {}) {
  const error = new Error(mensaje);
  error.statusCode = statusCode;
  error.details = details;
  return error;
}



export async function getMascotasService(soloPublicas = false) {
  try {
    const mascotaRepository = AppDataSource.getRepository(MascotaSchema);
    const mascotas = await mascotaRepository.find({
      where: soloPublicas ? { mascota_estado: "En Refugio"} : {},
    });
    
    const mascotasPublicas = mascotas.map((mascota) => ({
      mascota_id: mascota.mascota_id,
      mascota_nombreCompleto: mascota.mascota_nombreCompleto,
      mascota_especie: mascota.mascota_especie,
      mascota_edad: mascota.mascota_edad,
      mascota_peso: mascota.mascota_peso,
      mascota_sexo: mascota.mascota_sexo,
      mascota_estado: mascota.mascota_estado,
      mascota_fotoURL: mascota.mascota_fotoURL,
    }));
    return [mascotasPublicas, null];

  } catch (error) {
    console.error("Error al obtener a las mascotas:", error);
    return [null, "Error interno del servidor"];
  }
}

// Consulta general de una mascota (uso interno)
export async function getMascotaService(id) {
  try {
    const mascotaRepository = AppDataSource.getRepository(MascotaSchema);

    const mascota = await mascotaRepository.findOneBy({
      mascota_id: id,
    });

    if (!mascota) {
      return [null, "Mascota no encontrada"];
    }

    return [mascota, null];

  } catch (error) {
    console.error("Error al obtener la mascota:", error);
    return [null, "Error interno al obtener la mascota"];
  }
}

// Consulta del perfil público de una mascota
export async function getMascotaPublicaService(id) {
  try {
    const mascotaRepository = AppDataSource.getRepository(MascotaSchema);

    const mascota = await mascotaRepository.findOneBy({
      mascota_id: id,
    });

    if (!mascota) {
      return [null, "Mascota no encontrada"];
    }

    // Impedir el acceso público si tiene restricción sanitaria
    if (mascota.mascota_estado !== ESTADO_MASCOTA.EN_REFUGIO) {
      return [null, "Mascota no encontrada"];
    }

    return [mascota, null];

  } catch (error) {
    console.error("Error al obtener el perfil público:", error);
    return [null, "Error interno al obtener la mascota"];
  }
}

// Registrar mascota
export async function crearMascotaService(datosMascota) {
  try {
    const mascotaRepository = AppDataSource.getRepository(MascotaSchema);

    const mascota = mascotaRepository.create({
      ...datosMascota,
      mascota_fotoURL: datosMascota.mascota_fotoURL || null,
    });
    const mascotaGuardada = await mascotaRepository.save(mascota);

    return [mascotaGuardada, null];

  } catch (error) {
    console.error("Error al registrar a la mascota:", error);
    return [null, "Error interno al registrar la mascota"];
  }
}

// Actualizar mascota
export async function actualizarMascotaService(id, datosActualizados) {
  try {
    const mascotaRepository = AppDataSource.getRepository(MascotaSchema);

    const mascotaExistente = await mascotaRepository.findOneBy({
      mascota_id: id,
    });

    if (!mascotaExistente) {
      return [null, "Mascota no encontrada"];
    }

    // El estado sanitario no se puede modificar mediante el PUT general
    if (
      Object.hasOwn(datosActualizados, "mascota_estado") &&
      datosActualizados.mascota_estado !== mascotaExistente.mascota_estado
    ) {
      return [
        null,
        "El estado sanitario solo puede ser modificado por un Veterinario mediante la ruta correspondiente",
      ];
    }

    const datosNormalizados = { ...datosActualizados };

    if (Object.hasOwn(datosNormalizados, "mascota_fotoURL")) {
      datosNormalizados.mascota_fotoURL =
        datosNormalizados.mascota_fotoURL || null;
    }

    const mascotaActualizada = Object.assign(
      mascotaExistente,
      datosNormalizados
    );

    const mascotaGuardada = await mascotaRepository.save(
      mascotaActualizada
    );

    return [mascotaGuardada, null];

  } catch (error) {
    console.error("Error al actualizar a la mascota:", error);
    return [null, "Error interno al actualizar la mascota"];
  }
}

// Eliminar mascota
export async function eliminarMascotaService(id) {
  try {
    const mascotaRepository = AppDataSource.getRepository(MascotaSchema);

    const mascotaExistente = await mascotaRepository.findOneBy({
      mascota_id: id,
    });

    if (!mascotaExistente) {
      return [null, "Mascota no encontrada"];
    }

    await mascotaRepository.remove(mascotaExistente);

    return [mascotaExistente, null];

  } catch (error) {
    console.error("Error al eliminar a la mascota:", error);

    if (error?.driverError?.code === "23503") {
      return [
        null,
        "No se puede eliminar la mascota porque tiene registros relacionados",
      ];
    }

    return [null, "Error interno al eliminar la mascota"];
  }
}
export async function getMascotasInternasService() {
    try {
        const mascotaRepository =
            AppDataSource.getRepository(MascotaSchema);

        const mascotas = await mascotaRepository.find();

        return [mascotas, null];

    } catch (error) {
        console.error(
            "Error obteniendo mascotas internas:",
            error
        );

        return [null, "Error al obtener las mascotas"];
    }
}

async function revisarLote(manager, ids, bloquear = false) {
  const query = manager
    .getRepository(MascotaSchema)
    .createQueryBuilder("m")
    .where("m.mascota_id IN (:...ids)", { ids })
    .orderBy("m.mascota_id", "ASC");

  if (bloquear) {
    query.setLock("pessimistic_write");
  }

  const mascotas = await query.getMany();

  const encontrados = new Set(mascotas.map((m) => m.mascota_id));

  const faltantes = ids.filter((id) => !encontrados.has(id));

  if (faltantes.length) {
    throw errorLote(404, "Hay mascotas seleccionadas que ya no existen.", { idsNoEncontrados: faltantes });
  }

  const porId = new Map(
    mascotas.map((m) => [
      m.mascota_id,
      {
        id: m.mascota_id,
        nombre: m.mascota_nombreCompleto,
        registrosProtegidos: [],
        registrosCascada: [],
        _identificadoresCascada: [],
      },
    ])
  );

  // Consultar cada relación mediante TypeORM.
  for (const def of RELACIONES_LOTE) {
    const filas = await manager
      .getRepository(def.entidad)
      .createQueryBuilder("r")
      .innerJoin(`r.${def.relacion}`, "m")
      .select("m.mascota_id", "mascotaId")
      .addSelect(`r.${def.idRegistro}`, "registroId")
      .where("m.mascota_id IN (:...ids)", { ids })
      .orderBy("m.mascota_id", "ASC")
      .addOrderBy(`r.${def.idRegistro}`, "ASC")
      .getRawMany();

    const grupos = new Map();

    for (const fila of filas) {
      const id = Number(fila.mascotaId);

      if (!grupos.has(id)) {
        grupos.set(id, []);
      }

      grupos.get(id).push(Number(fila.registroId));
    }

    for (const [id, registros] of grupos) {
      if (!registros.length) continue;

      const mascota = porId.get(id);

      const dato = {tipo: def.nombre, cantidad: registros.length,};

      if (def.tipo === "protegida") {
        mascota.registrosProtegidos.push(dato);
      } else {
        mascota.registrosCascada.push(dato);

        mascota._identificadoresCascada.push([def.entidad, registros, ]);
      }
    }
  }

  return [...porId.values()].map((mascota) => {
    const firma = mascota.registrosCascada.length
      ? createHash("sha256")
          .update(
            JSON.stringify([
              mascota.id,
              mascota._identificadoresCascada,
            ])
          )
          .digest("hex")
      : null;

    let estado = "libre";

    if (mascota.registrosProtegidos.length) {
      estado = "bloqueada";
    } else if (mascota.registrosCascada.length) {
      estado = "confirmacion";
    }

    // No exponer los identificadores internos
    // utilizados para calcular la firma.
    const {_identificadoresCascada, ...datosPublicos} = mascota;

    return {...datosPublicos, estado, firma,};
  });
}

export async function revisarMascotasLoteService(ids) {
  try {
    const mascotas = await revisarLote(AppDataSource.manager, ids);
    return [{mascotas}, null];
  } catch (error) {
    return [null, normalizarErrorLote(error)];
  }
}

//eliminar mas de una mascota a la vez
export async function eliminarMascotasLoteService({ids, confirmadas = [], canceladas = [],}) {
  if (!Array.isArray(ids)) {
    return [
      null,
      {
        statusCode: 400,
        message:
          "Los identificadores deben enviarse en un arreglo.",
        details: {},
      },
    ];
  }
  
  try {
    const resultado = await AppDataSource.transaction(async (manager) => {
      //1 revisar las mascotas dentro de la transaccion
      const mascotas = await revisarLote(manager, ids, true);
      const confirmaciones = new Map(confirmadas.map((item) => [item.id, item.firma]));

      const descartadas = new Set(canceladas);

      //2 identificar mascotas bloqueadas
      const bloqueadas = mascotas.filter((mascota) => mascota.estado === "bloqueada");

      //3 identificar confirmaciones pendientes
      const pendientes = mascotas.filter((mascota) => 
        mascota.estado === "confirmacion" && 
        !descartadas.has(mascota.id) &&
        confirmaciones.get(mascota.id) !== mascota.firma
      );

      if (pendientes.length > 0) {
        throw errorLote(400, "Hay mascotas con confirmación pendiente", { codigo: "REVISION_REQUERIDA", mascotas: pendientes, });
      }

      //4 Excluir bloqueadas y canceladas
      const eliminables = mascotas.filter((mascota) =>
        mascota.estado !== "bloqueada" &&
        !descartadas.has(mascota.id)
      );

      //5 eliminar las mascotas confirmadas
      if(eliminables.length > 0){
        const idsAEliminar = eliminables.map((mascota) => mascota.id);

        const borrado = await manager.getRepository(MascotaSchema).delete(idsAEliminar);

        if (borrado.affected !== idsAEliminar.length) {
          throw new Error("Eliminación incompleta. Se revierte la transacción.");
        }
      }

      //6 contabilizar cancelaciones del user
      const canceladasUsuario = mascotas.filter((mascota) => 
        mascota.estado !== "bloqueada" &&
        descartadas.has(mascota.id)
      );

      //7 construir resultado
      const partes = [
        eliminables.length === 0
          ? "No se eliminó ninguna mascota"
          : eliminables.length === 1
            ? "Se eliminó 1 mascota"
            : `Se eliminaron ${eliminables.length} mascotas`,
      ];

      if (bloqueadas.length > 0) {
        partes.push(
          `${bloqueadas.length} ${
            bloqueadas.length === 1
              ? "fue descartada"
              : "fueron descartadas"
          } por tener registros protegidos`
        );
      }

      if (canceladasUsuario.length > 0) {
        partes.push(
          `${canceladasUsuario.length} ${
            canceladasUsuario.length === 1
              ? "fue cancelada"
              : "fueron canceladas"
          } por decisión del usuario`
        );
      }

      return {
        cantidadEliminada: eliminables.length,
        cantidadBloqueada: bloqueadas.length,
        cantidadCancelada: canceladasUsuario.length,
        idsEliminados: eliminables.map((m) => m.id),
        idsCancelados: canceladasUsuario.map((m) => m.id),
        bloqueadas,
        mensaje: partes.join("; ") + ".",
      };
    });

    return [resultado, null];
  } catch (error) {
    return [null, normalizarErrorLote(error)];
  }
}

