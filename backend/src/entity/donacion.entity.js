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
        categoriaDonacion:{
            type: "varchar",
            length: 15,
            nullable: false,
        },
        apadrinado:{
            type: "boolean",
            nullable: false,
            default: false,
        },
        detalleInsumo:{
            type: "text",
            nullable: true,
        },
        estado:{
            type: "varchar",
            length: 15,
            nullable: false,
        },
        fechaTransaccion:{
            type: "timestamp",
            createDate: true,
            nullable: false,
        },
    },

    relations: {
        usuario: {
            target: "Usuario",
            type: "many-to-one",
            joinColumn: { name: "usuarioId" },
            nullable: false
        },
        animal: {
            target: "Mascota",
            type: "many-to-one",
            joinColumn: { name: "animal_id" },
            nullable: true
        }
    }
});

export default donacionSchema;