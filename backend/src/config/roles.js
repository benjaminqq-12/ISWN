"use strict";

export const ROL_USUARIO = "Usuario";
export const ROL_VOLUNTARIO = "Voluntario";
export const ROL_ADMIN = "Admin";

// Roles que un administrador puede asignar al crear una cuenta.
// Los voluntarios los registra otro módulo; para habilitarlos aquí, agrega ROL_VOLUNTARIO.
export const ROLES_CREABLES_POR_ADMIN = [ROL_ADMIN, ROL_USUARIO];