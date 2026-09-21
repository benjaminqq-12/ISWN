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
        rutVoluntario: {
            type: "varchar",
            length: 12,
            nullable: false,
            unique: true,
        },
        voluntarioNombre: {
            type: "varchar",
            length: 100,
            nullable: false,
        },
        voluntarioEmail: {
            type: "varchar",
            length: 100,
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