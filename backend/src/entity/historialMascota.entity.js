"use strict";
import { EntitySchema } from "typeorm";

const HistorialMascotaSchema = new EntitySchema({
    name: "Usuario",
    tableName: "usuarios",
    columns: {
        historialMascota_id: {
            type: "int",
            primary: true,
            generated: true,
        },
        historialMascota_tipoEvento: {
            type: "varchar",
            length: 100,
            nullable: false,
        },
        historialMascota_descripcion: {
            type: "varchar",
            length: 100,
        },
        historialMascota_fecha:{
            type: "date"
        }
    },
    relations: {
        historialAdopcion_mascota: {
            type: "one-to-one",
            target: "mascota",
            joinColumn: { name: mascota_id },
            nullable: true,
            onDelete: "CASCADE"
        },
        historialAdopcion_solicitudAdopcion: {
            type: "one-to-many",
            target: "solicitudAdopcion",
            joinColumn: { name: solicitudAdopcion_id },
            onDelete: "CASCADE"
        },
        historialAdopcion_registradoPorUsuario: {
            type: "one-to-many",
            target: "usuario",
            joinColumn: { name: usuarioId },
        }
    }
});

export default HistorialMascotaSchema;