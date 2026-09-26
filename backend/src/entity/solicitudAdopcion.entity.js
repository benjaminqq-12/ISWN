"use strict";
import { EntitySchema, JoinColumn } from "typeorm";

const SolicitudAdopcionSchema = new EntitySchema({
    name: "Usuario",
    tableName: "usuarios",
    columns: {
        solicitudAdopcion_id: {
            type: "int",
            primary: true,
            generated: true,
        },
        solicitudAadopcion_estado: {
            type: "varchar",
            length: 100,
            nullable: false,
        },
        solicitudAadopcion_fechaSolicitud: {
            type: "date",
            nullable: false,
        },
        solicitudAdopcion_feunionInicial: {
            type: "date",
            nullable: true,
        },
        solicitudAadopcion_visitaHogar: {
            type: "date",
            nullable: true,
        },
        solicitudAdopcion_resultadoEntrevista: {
            type: "varchar",
            length: 512,
            nullable: true,
        },
        solicitudAdopcion_motivoCancelación: {
            type: "varchar",
            length: 512,
            nullable: true,
        },
        createdAt: {
            type: "timestamp with time zone",
            default: () => "CURRENT_TIMESTAMP",
            nullable: false,
        },
        updatedAt: {
            type: "timestamp with time zone",
            default: () => "CURRENT_TIMESTAMP",
            onUpdate: "CURRENT_TIMESTAMP",
            nullable: false,
        },
    },
    relations: {
        solicitudAdopcion_mascotaAdoptada: {
            type: "many-to-one",
            target: "mascota",
            joinColumn: { name: mascota_id },
            nullable: true,
            onDelete: "CASCADE"
        },
        solicitudAdopcion_usuarioAdoptante: {
            type: "one-to-one",
            target: "usuario",
            joinColumn: { name: usuarioId },
            onDelete: "CASCADE"
        },
        solicitudAdopcion_voluntarioResponsable: {
            type: "one-to-one",
            targer: "usuario",
            joinColumn: { name: usuarioId },
            onDelete: "CASCADE"
        }
    }
});

export default SolicitudAdopcionSchema;