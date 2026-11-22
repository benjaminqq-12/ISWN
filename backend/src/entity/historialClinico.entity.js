
"use strict";

import { EntitySchema } from "typeorm";

const HistorialClinicoSchema = new EntitySchema({
    name: "HistorialClinico",
    tableName: "historial_clinico",

    columns: {
        historialClinico_id: {
            type: "int",
            primary: true,
            generated: true
        }
    },

    relations: {
        historialClinico_mascota: {
            type: "many-to-one",
            target: "Mascota",
            joinColumn: {
                name: "mascota_id"
            },
            nullable: false,
            onDelete: "CASCADE"
        },

        historialClinico_atencionMedica: {
            type: "one-to-one",
            target: "AtencionMedica",
            joinColumn: {
                name: "atencion_id"
            },
            nullable: false,
            onDelete: "CASCADE"
        }
    }
});

export default HistorialClinicoSchema;