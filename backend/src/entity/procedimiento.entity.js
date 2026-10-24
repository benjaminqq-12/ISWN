"use strict";

import { EntitySchema } from "typeorm";

export const Procedimiento = new EntitySchema({
    name: "Procedimiento",
    tableName: "procedimientos",

    columns: {
        procedimiento_id: {
            type: "int",
            primary: true,
            generated: true
        },

        procedimiento_tipo: {
            type: "varchar",
            length: 30
        },

        procedimiento_descripcion: {
            type: "text"
        },

        procedimiento_fecha: {
            type: "date"
        }
    },

    relations: {
        atencionMedica: {
            type: "many-to-one",
            target: "AtencionMedica",
            joinColumn: {
                name: "atencion_id"
            },
            nullable: false
        }
    }
});