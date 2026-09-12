"use strict";
import { EntitySchema } from "typeorm";

const animalSchema = new EntitySchema({
    name: "animal",
    tableName: "animales",
    columns: {
        animalId: {
            type: "int",
            primary: true,
            generated: true,
        },
        nombre: {
            type: "varchar",
            length: 100,
            nullable: false,
        },
        chip: {
            type: "boolean",
            nullable: false,
        },
        
    }
});

export default animalSchema;