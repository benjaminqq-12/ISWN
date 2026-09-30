"use strict";
import { EntitySchema, JoinColumn } from "typeorm";

const SolicitudAdopcionSchema = new EntitySchema({
    name: "SolicitudAdopcion",
    tableName: "solicitudesAdopcion",
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
        target: "Mascota",
        joinColumn: { name: "mascotaAdoptada_id" },
        nullable: true,
        onDelete: "CASCADE"
    },
    solicitudAdopcion_usuarioAdoptante: {
        type: "many-to-one",
        target: "Usuario",
        joinColumn: { name: "usuarioAdoptante_id" },
        onDelete: "CASCADE"
    },
    solicitudAdopcion_voluntarioResponsable: {
        type: "many-to-one",
        target: "Usuario",
        joinColumn: { name: "voluntarioResponsable_id" },
        nullable: true,
        onDelete: "CASCADE"
    }
}
});

export default SolicitudAdopcionSchema;