"use strict";
import { EntitySchema } from "typeorm";

const animalSchema = new EntitySchema({
    name: "Animal",
    tableName: "Animales",
    columns: {
        animalId: {
            type: "int",
            primary: true,
            generated: true,
        },
        animalNombre: {
            type: "varchar",
            length: 100,
            nullable: false,
        },
        chip: {
            type: "boolean",
            nullable: false,
            default: false,
        },
        numeroChip:{
            type: "varchar",
            length: 50,
            nullable: true,
        },
        peso: {
            type: "float",
            nullable: false,
        },
        especie: {
            type: "varchar",
            length: 5,
            nullable: false,
        },
        raza:{
            type: "varchar",
            length: 50,
            nullable: false,
        },
        animalEdad:{
            type: "varchar",
            nullable: false,
        },
        estado:{
            type: "varchar",
            length: 15,
            nullable: false,
        },
        viaIngreso:{
            type: "varchar",
            length: 15,
            nullable: false,
        },
        estadoGeneralIngreso:{
            type: "varchar",
            length: 100,
            nullable: false,
        },
        fechaIngreso:{
            type: "date",
            nullable: false,
        }
    },

    indices: [
        {
            name: "IDX_ESTADO_ANIMAL",
            columns: ["estado"]
        }
    ]
});

export default animalSchema;