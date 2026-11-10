"use strict";
import { EntitySchema } from "typeorm";

const SuscripcionDonacionSchema = new EntitySchema({
    name: "SuscripcionDonacion",
    tableName: "SuscripcionesDonaciones",
    columns: {
        suscripcionId: {
            type: "int",
            primary: true,
            generated: true,
        },
        monto: {
            type: "int",
            nullable: false,
        },
        mensaje: {
            type: "text",
            default: "",
        },
        estado: {
            type: "varchar",
            length: 20,
            default: "Pendiente",
        },
        creadoEn: {
            type: "timestamptz",
            createDate: true,
        },
        desactivadoEn: {
            type: "timestamptz",
            nullable: true,
        },
        motivoDesactivacion: {
            type: "varchar",
            length: 500,
            nullable: true,
        },
    },
    relations: {
        usuario: {
            target: "Usuario",
            type: "many-to-one",
            joinColumn: { name: "usuarioId" },
            nullable: false,
        },
        animal: {
            target: "Mascota",
            type: "many-to-one",
            joinColumn: { name: "animal_id" },
            nullable: true,
        },
        desactivadoPor: {
            target: "Usuario",
            type: "many-to-one",
            joinColumn: { name: "desactivadoPorId" },
            nullable: true,
        },
    },
});

export default SuscripcionDonacionSchema;
