"use strict";

// Estados posibles de una solicitud de adopción
export const ESTADOS_SOLICITUD = {
  PENDIENTE: "Pendiente",
  REUNION_INICIAL: "Reunión inicial",
  VISITA_ENTREVISTA: "Visita/entrevista",
  SEGUIMIENTO: "Seguimiento post-adopción",
  ADOPTADA: "Adoptada",
  CANCELADA: "Cancelada",
};

// Transiciones permitidas: estado actual -> estados a los que puede avanzar
export const TRANSICIONES_SOLICITUD = {
  [ESTADOS_SOLICITUD.PENDIENTE]: [
    ESTADOS_SOLICITUD.REUNION_INICIAL,
    ESTADOS_SOLICITUD.CANCELADA,
  ],
  [ESTADOS_SOLICITUD.REUNION_INICIAL]: [
    ESTADOS_SOLICITUD.VISITA_ENTREVISTA,
    ESTADOS_SOLICITUD.CANCELADA,
  ],
  [ESTADOS_SOLICITUD.VISITA_ENTREVISTA]: [
    ESTADOS_SOLICITUD.SEGUIMIENTO,
    ESTADOS_SOLICITUD.CANCELADA,
  ],
  [ESTADOS_SOLICITUD.SEGUIMIENTO]: [
    ESTADOS_SOLICITUD.ADOPTADA,
    ESTADOS_SOLICITUD.CANCELADA,
  ],
  // Estados finales: no se puede avanzar desde aquí
  [ESTADOS_SOLICITUD.ADOPTADA]: [],
  [ESTADOS_SOLICITUD.CANCELADA]: [],
};

// Roles que pueden autorizar el avance de una solicitud
export const ROLES_AUTORIZADORES = ["Admin", "Voluntario"];

export function getSiguientesEstados(estadoActual) {
  return TRANSICIONES_SOLICITUD[estadoActual] ?? [];
}

export function esTransicionValida(estadoActual, nuevoEstado) {
  return getSiguientesEstados(estadoActual).includes(nuevoEstado);
}

export function puedeAutorizar(rol) {
  return ROLES_AUTORIZADORES.includes(rol);
}