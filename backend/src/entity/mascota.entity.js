"use strict";
import { EntitySchema } from "typeorm";

const MascotaSchema = new EntitySchema({
    name: "Usuario",
    tableName: "usuarios",
    columns: {
        mascota_id: {
            type: "int",
            primary: true,
            generated: true,
        },
        mascota_nombreCompleto: {
            type: "varchar",
            length: 100,
            nullable: false,
        },
        mascota_especie: {
            type: "varchar",
            length: 100,
            nullable: false
        },
        mascota_edad: {
            type: "int",
        },
        mascota_peso: {
            type: "float",
            nullable: false
        },
        mascota_sexo: {
            type: "varchar",
            length: 100,
            nullable: false
        },
        mascota_viaIngreso: {
            type: "varchar",
            length: 512,
            nullable: false
        },
        mascota_estado: {
            type: "varchar",
            length: 100,
            nullable: false
        },
        mascota_antecedentesPrevios: {
            type: "varchar",
            length: 512,
            nullable: false
        },
        mascota_fotoURL: {
            type: "varchar",
            length: 512,
            nullable: true
        },
        createdAt: {
            type: "timestamp with time zone",
            default: () => "CURRENT_TIMESTAMP",
            nullable: false,
        },
        updatedAt: {
            type: "timestamp with time zone",
            default: () => "CURRENT_TIMESTAMP",
            onUpdate: "CURRENT_TIMESTAMP",
            nullable: false,
        },
    }
});

export default MascotaSchema;