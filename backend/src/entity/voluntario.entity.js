"use strict";

import { EntitySchema } from "typeorm";

const VoluntarioSchema = new EntitySchema({
    name: "Voluntario",
    tableName: "Voluntarios",

    columns: {
        voluntarioId: {
            type: "int",
            primary: true,
            generated: true,
        },

        // Información personal
        nombreCompleto: {
            type: "varchar",
            length: 120,
            nullable: false,
        },

        rut: {
            type: "varchar",
            length: 12,
            nullable: false,
            unique: true,
        },

        fechaNacimiento: {
            type: "date",
            nullable: false,
        },

        telefono: {
            type: "varchar",
            length: 30,
            nullable: false,
        },

        email: {
            type: "varchar",
            length: 120,
            nullable: false,
            unique: true,
        },

        direccion: {
            type: "varchar",
            length: 200,
            nullable: false,
        },

        // Contacto de emergencia
        contactoNombre: {
            type: "varchar",
            length: 120,
            nullable: false,
        },

        contactoParentesco: {
            type: "varchar",
            length: 50,
            nullable: false,
        },

        contactoTelefono: {
            type: "varchar",
            length: 30,
            nullable: false,
        },

        // Array de áreas seleccionadas
        areasInteres: {
            type: "jsonb",
            nullable: false,
            default: () => "'[]'",
        },

        // Disponibilidad de lunes a domingo
        disponibilidad: {
            type: "jsonb",
            nullable: false,
            default: () => "'{}'",
        },

        // Transporte
        disponibleTraslados: {
            type: "boolean",
            nullable: false,
            default: false,
        },

        poseeVehiculo: {
            type: "boolean",
            nullable: false,
            default: false,
        },

        tipoVehiculo: {
            type: "varchar",
            length: 80,
            nullable: true,
        },

        // Información administrativa
        estado: {
            type: "varchar",
            length: 30,
            nullable: false,
            default: "Pendiente",
        },

        observaciones: {
            type: "varchar",
            length: 500,
            nullable: true,
        },

        fechaRegistro: {
            type: "timestamp",
            createDate: true,
        },
    },

    indices: [
        {
            name: "IDX_VOLUNTARIO_ESTADO",
            columns: ["estado"],
        },
    ],
});

export default VoluntarioSchema;