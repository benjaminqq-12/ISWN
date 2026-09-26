"use strict";
import { EntitySchema } from "typeorm";

const VoluntarioSchema = new EntitySchema({
    name: "Voluntario",
    tableName: "voluntarios",
    columns: {
        voluntarioId: {
            type: "int",
            primary: true,
            generated: true,
        },
        nombre: {
            type: "varchar",
            length: 100,
            nullable: false,
        },
        email: {
            type: "varchar",
            length: 100,
        }
    }
});

export default VoluntarioSchema;