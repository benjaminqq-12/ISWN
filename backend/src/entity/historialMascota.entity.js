"use strict";
import { EntitySchema } from "typeorm";

const HistorialMascotaSchema = new EntitySchema({
    name: "HistorialMascota",
    tableName: "historialesMascota",
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
            length: 512,
        },
        historialMascota_fecha: {
            type: "date"
        }
    },
    relations: {
        historialAdopcion_mascota: {
            type: "many-to-one",
            target: "Mascota",
            joinColumn: { name: "mascota_id" },
            nullable: false,
            onDelete: "CASCADE"
        },
        historialAdopcion_solicitudAdopcion: {
            type: "many-to-one",
            target: "SolicitudAdopcion",
            joinColumn: { name: "solicitudAdopcion_id" },
            nullable: true,
            onDelete: "CASCADE"
        },
        historialAdopcion_registradoPorUsuario: {
            type: "many-to-one",
            target: "Usuario",
            joinColumn: { name: "usuarioId" },
            nullable: true,
            onDelete: "SET NULL"
        }
    }
});

export default HistorialMascotaSchema;