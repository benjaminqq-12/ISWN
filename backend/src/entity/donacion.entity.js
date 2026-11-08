"use strict";
import { EntitySchema, TreeLevelColumn } from "typeorm";

const donacionSchema = new EntitySchema({
    name: "Donacion",
    tableName: "Donaciones",
    columns: {
        donacionId: {
            type: "int",
            primary: true,
            generated: true,
        },
        modalidad: {
            type: "varchar",
            length: 10,
            default: "Unica",
        },
        monto:{
            type: "int",
            nullable: false,
            default: 0,
        },
        categoriaDonacion:{
            type: "varchar",
            length: 15,
            nullable: false,
            default: "Dinero",
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
        mensaje: {
            type: "text",
            default: ""
        },
        estado:{
            type: "varchar",
            length: 15,
            nullable: false,
            default: "Pendiente",
        },
        reciboEstado: {
            type: "varchar",
            length: 20,
            default: "Pendiente"
        },
        fechaTransaccion:{
            type: "timestamp",
            createDate: true,
            nullable: false,
        },
        confirmadoEn: {
            type: "timestamptz",
            nullable: true
        }
    },
    relations: {
        usuario: {
            target: "Usuario",
            type: "many-to-one",
            joinColumn: { name: "usuarioId" },
            nullable: false
        },
        suscripcion: {
            target: "SuscripcionDonacion",
            type: "many-to-one",
            joinColumn: { name: "suscripcionId" },
            nullable: true,
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