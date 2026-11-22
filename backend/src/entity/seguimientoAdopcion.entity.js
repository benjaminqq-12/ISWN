"use strict";
import { EntitySchema } from "typeorm";

const SeguimientoAdopcionSchema = new EntitySchema({
    name: "SeguimientoAdopcion",
    tableName: "seguimientosAdopcion",
    columns: {
        seguimientoAdopcion_id: {
            type: "int",
            primary: true,
            generated: true,
        },
        seguimientoAdopcion_plazoDias: {
            type: "int",
            nullable: false,
        },
        seguimientoAdopcion_fechaLimite: {
            type: "date",
            nullable: false,
        },
        // mientras resultado sea null, el seguimiento está pendiente
        seguimientoAdopcion_tipo: {
            type: "varchar",
            length: 20,
            nullable: true,
        },
        seguimientoAdopcion_resultado: {
            type: "varchar",
            length: 30,
            nullable: true,
        },
        seguimientoAdopcion_detalle: {
            type: "varchar",
            length: 512,
            nullable: true,
        },
        seguimientoAdopcion_fechaRegistro: {
            type: "timestamp with time zone",
            nullable: true,
        },
        createdAt: {
            type: "timestamp with time zone",
            default: () => "CURRENT_TIMESTAMP",
            nullable: false,
        },
    },
    relations: {
        seguimientoAdopcion_solicitud: {
            type: "many-to-one",
            target: "SolicitudAdopcion",
            joinColumn: { name: "solicitudAdopcion_id" },
            nullable: false,
            onDelete: "CASCADE",
        },
        seguimientoAdopcion_registradoPorUsuario: {
            type: "many-to-one",
            target: "Usuario",
            joinColumn: { name: "registradoPor_id" },
            nullable: true,
            onDelete: "SET NULL",
        },
    },
});

export default SeguimientoAdopcionSchema;