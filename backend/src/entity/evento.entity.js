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
        categoria: {
            type: "varchar",
            length: 20,
            nullable: false
        },
        fechaEvento: {
            type: "date",
            nullable: false,
        },
        horaInicio: {
            type: "varchar",
            length: 5, // "HH:MM", "14:30"
            nullable: false,
        },
        horaFin: {
            type: "varchar",
            length: 5,
            nullable: true,
        },
        capacidadMaxima:{
            type: "int",
            nullable: true,
        },
        lugar: {
            type: "varchar",
            length: 200,
            nullable: false,
        },
        version: {
            type: "int",
            default: 1,
        },
        estado: {
            type: "varchar",
            length: 20, // "Programado", "Finalizado", "Cancelado"
            nullable: false,
            default: "Activo"
        }
    },
    relations: {
        organizador: {
            target: "Usuario", 
            type: "many-to-one",
            joinColumn: { name: "organizadorId" },
            nullable: false 
        }
    },
    indices: [
        {
            name: "IDX_FECHA_EVENTO",
            columns: ["fechaEvento"]
        },
        {
            name: "IDX_CATEGORIA_EVENTO",
            columns: ["categoria"]
        }
    ]
});

export default EventoSchema;