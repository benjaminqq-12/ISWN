"use strict";
import { EntitySchema } from "typeorm";

const InscripcionSchema = new EntitySchema({
    name: "Inscripcion",
    tableName: "InscripcionesEventos",
    columns: {
        inscripcionId: {
            type: "int",
            primary: true,
            generated: true,
        },
        fechaInscripcion: {
            type: "timestamp",
            createDate: true,
            nullable: false,
        },
        asistenciaConfirmada: {
            type: "boolean",
            default: false,
            nullable: false,
        }
    },
    relations: {
        evento: {
            target: "Evento",
            type: "many-to-one",
            joinColumn: { name: "eventoId" },
            nullable: false
        },
        usuario: {
            target: "Usuario",
            type: "many-to-one",
            joinColumn: { name: "usuarioId" },
            nullable: false
        }
    },
    indices: [
        {
            name: "IDX_UNICA_INSCRIPCION",
            columns: ["evento", "usuario"],
            unique: true 
        }
    ]
});

export default InscripcionSchema;