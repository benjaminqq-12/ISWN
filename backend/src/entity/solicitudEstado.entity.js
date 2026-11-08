
"use strict";

import { EntitySchema } from "typeorm";

const SolicitudEstadoSchema = new EntitySchema({
    name: "SolicitudEstado",
    tableName: "solicitudes_estado",

    columns: {
        solicitudEstadoId: {
            type: "int",
            primary: true,
            generated: true,
        },
        estadoSolicitado: {
            type: "varchar",
            length: 30,
            nullable: false,
        },
        motivo: {
            type: "varchar",
            length: 512,
            nullable: false,
        },
        estadoSolicitud: {
            type: "varchar",
            length: 20,
            nullable: false,
            default: "PENDIENTE",
        },
        fechaSolicitud: {
            type: "timestamp with time zone",
            nullable: false,
            default: () => "CURRENT_TIMESTAMP",
        },
        fechaResolucion: {
            type: "timestamp with time zone",
            nullable: true,
        },
        comentarioResolucion: {
            type: "varchar",
            length: 512,
            nullable: true,
        },
    },

    relations: {
        mascota: {
            type: "many-to-one",
            target: "Mascota",
            joinColumn: {
                name: "mascota_id",
                referencedColumnName: "mascota_id",
            },
            nullable: false,
        },
        solicitante: {
            type: "many-to-one",
            target: "Usuario",
            joinColumn: {
                name: "solicitante_id",
                referencedColumnName: "usuarioId",
            },
            nullable: false,
        },
        revisor: {
            type: "many-to-one",
            target: "Usuario",
            joinColumn: {
                name: "revisor_id",
                referencedColumnName: "usuarioId",
            },
            nullable: true,
        },
    },
});

export default SolicitudEstadoSchema;
