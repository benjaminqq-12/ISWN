"use strict";

import { EntitySchema } from "typeorm";

const CalendarioSanidadSchema = new EntitySchema({

    name: "CalendarioSanidad",

    tableName: "calendario_sanidad",

    columns: {

        calendarioSanidad_id: {
            type: "int",
            primary: true,
            generated: true
        },

        calendarioSanidad_tipo: {
            type: "varchar",
            length: 100,
            nullable: false
        },

        calendarioSanidad_descripcion: {
            type: "text",
            nullable: false
        },

        calendarioSanidad_fecha: {
            type: "date",
            nullable: false
        },

        calendarioSanidad_estado: {
            type: "varchar",
            length: 30,
            nullable: false
        }
    },

    relations: {

        calendarioSanidad_mascota: {
            type: "many-to-one",
            target: "Mascota",
            joinColumn: {
                name: "mascota_id"
            },
            nullable: false,
            onDelete: "CASCADE"
        },

        calendarioSanidad_atencionMedica: {
            type: "many-to-one",
            target: "AtencionMedica",
            joinColumn: {
                name: "atencion_id"
            },
            nullable: true,
            onDelete: "SET NULL"
        }
    }
});

export default CalendarioSanidadSchema;