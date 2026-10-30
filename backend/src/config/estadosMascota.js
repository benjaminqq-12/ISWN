"use strict";

// Estados válidos de una mascota (fuente única de verdad)
export const ESTADOS_MASCOTA = [
  "En Refugio",
  "En Tratamiento",
  "En Cuarentena",
  "En Observación",
  "Adoptada",
];

// Tipos de evento que un voluntario puede agregar a mano al historial
export const TIPOS_EVENTO_MANUAL = [
  "Observación",
  "Seguimiento post-adopción",
  "Atención médica",
  "Otro",
];