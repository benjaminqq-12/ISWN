"use strict";
import { EntitySchema } from "typeorm";

const UsuarioSchema = new EntitySchema({
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
        SolicitudAadopcion_fechaSolicitud: {
            type: "date",
            nullable: false,
        },
        SolicitudAdopcion_feunionInicial: {
            type: "date",
            nullable: true,
        },
        SolicitudAadopcion_visitaHogar: {
            type: "date",
            nullable: true,
        },
        SolicitudAdopcion_resultadoEntrevista: {
            type: "varchar",
            length: 512,
            nullable: true,
        },
        SolicitudAdopcion_motivoCancelación: {
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
    }
});

export default UsuarioSchema;