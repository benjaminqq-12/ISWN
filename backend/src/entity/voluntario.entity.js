"use strict";
import { EntitySchema } from "typeorm";

const VoluntarioSchema = new EntitySchema({
    name: "Voluntario",
    tableName: "Voluntarios",
    columns: {
        voluntarioId: {
            type: "int",
            primary: true,
            generated: true,
        },
        voluntarioNombre: {
            type: "varchar",
            length: 100,
            nullable: false,
        },
        voluntarioEmail: {
            type: "varchar",
            length: 100,S
        },
        voluntarioPassword: {
            type: "varchar",
            nullable: false,
        },
        rol: {
            type: "varchar",
            length: 15,
            nullable: false,
        }
    }
});

export default VoluntarioSchema;