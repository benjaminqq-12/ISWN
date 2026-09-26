"use strict";
import { EntitySchema } from "typeorm";

const EventoSchema = new EntitySchema({
    name: "Evento",
    tableName: "Eventos",
    columns: {
        eventoId: {
            type: "int",
            primary: true,
            generated: true,
        },
        titulo: {
            type: "varchar",
            length: 150,
            nullable: false,
        },
        descripcion: {
            type: "text",
            nullable: false,
        },
        fechaEvento: {
            type: "date",
            nullable: false,
        },
        horaInicio: {
            type: "varchar",
            length: 5,
            nullable: false,
        },
        lugar: {
            type: "varchar",
            length: 200,
            nullable: false,
        },
        estado: {
            type: "varchar",
            length: 20,
            nullable: false,
            default: "Programado"
        }
    },
    relations: {
        organizador: {
            target: "Voluntario",
            type: "many-to-one",
            joinColumn: { name: "organizadorId" },
            nullable: false
        }
    },

    indices: [
        {
            name: "IDX_FECHA_EVENTO",
            columns: ["fechaEvento"]
        }
    ]
});

export default EventoSchema;