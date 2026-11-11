
"use strict";

import { EntitySchema } from "typeorm";

export const Vacuna = new EntitySchema({
    name: "Vacuna",
    tableName: "vacunas",

    columns: {
        vacuna_id: {
            type: "int",
            primary: true,
            generated: true
        },
        vacuna_nombre: {
            type: "varchar",
            length: 100,
            nullable: false
        },
        vacuna_dosis: {
            type: "varchar",
            length: 100,
            nullable: false
        },
        vacuna_fechaAplicacion: {
            type: "date",
            nullable: false
        },
        vacuna_proximaDosis: {
            type: "date",
            nullable: true
        }
    },

    relations: {
        mascota: {
            type: "many-to-one",
            target: "Mascota",
            joinColumn: {
                name: "mascota_id"
            },
            nullable: false,
            onDelete: "CASCADE"
        },

        atencionMedica: {
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
