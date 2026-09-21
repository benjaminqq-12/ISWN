"use strict";
import { EntitySchema } from "typeorm";

const donacionSchema = new EntitySchema({
    name: "Donacion",
    tableName: "Donaciones",
    columns: {
        donacionId: {
            type: "int",
            primary: true,
            generated: true,
        },
        monto:{
            type: "int",
            nullable: false,
        },
        tipo:{
            type: "varchar",
            length: 15,
            nullable: false,
        },
        estado:{
            type: "varchar",
            length: 15,
            nullable: false,
        },
        fechaTransaccion:{
            type: "date",
            nullable: false,
        },
    },

    relations: {
        usuario: {
            target: "Usuario",
            type: "many-to-one",
            joinColumn: { name: "usuario_id" },
            nullable: false
        },
        animal: {
            target: "Animal",
            type: "many-to-one",
            joinColumn: { name: "animal_id" },
            nullable: true
        }
    }
});

export default donacionSchema;