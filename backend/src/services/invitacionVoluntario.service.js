
"use strict";

import { randomBytes, createHash } from "node:crypto";
import { AppDataSource } from "../config/configDb.js";
import InvitacionVoluntarioSchema from "../entity/invitacionVoluntario.entity.js";

// Convierte el token en un hash seguro.
function generarHash(token) {
  return createHash("sha256").update(token).digest("hex");
}

// Genera una nueva invitación válida por 24 horas.
export async function crearInvitacionVoluntario(voluntarioId) {
  const repositorio = AppDataSource.getRepository(
    InvitacionVoluntarioSchema
  );

  const token = randomBytes(32).toString("hex");

  const fechaExpiracion = new Date(
    Date.now() + 24 * 60 * 60 * 1000
  );

  // Guardamos la nueva invitación sin invalidar las anteriores.
  const invitacion = repositorio.create({
    voluntarioId,
    tokenHash: generarHash(token),
    fechaExpiracion,
    utilizada: false,
  });

  await repositorio.save(invitacion);

  return token;
}

// Comprueba que la invitación exista y esté vigente.
export async function buscarInvitacionValida(token) {
  if (
    typeof token !== "string" ||
    !/^[a-f0-9]{64}$/.test(token)
  ) {
    return null;
  }

  const repositorio = AppDataSource.getRepository(
    InvitacionVoluntarioSchema
  );

  const invitacion = await repositorio.findOne({
    where: {
      tokenHash: generarHash(token),
      utilizada: false,
    },
  });

  if (!invitacion) {
    return null;
  }

  if (new Date(invitacion.fechaExpiracion) <= new Date()) {
    return null;
  }

  return invitacion;
}
