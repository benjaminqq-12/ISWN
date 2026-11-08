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
              vacuna_proximaDosis: {
             type: "date",
            nullable: true
        },
        vacuna_nombre: {
            type: "varchar",
            length: 100
        },

        vacuna_dosis: {
            type: "varchar",
            length: 100
        },
      
        vacuna_fechaAplicacion: {
            type: "date"
        },
        vacuna_proximaDosis: {
        type: "date",
         nullable: true
        },
       
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