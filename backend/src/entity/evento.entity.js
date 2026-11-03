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
            nullable: true,
        },
        categoria: {
            type: "varchar",
            length: 20,
            nullable: true
        },
        fechaEvento: {
            type: "date",
            nullable: true
        },
        horaInicio: {
            type: "varchar",
            length: 5, // "HH:MM", "14:30"
            nullable: true
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
            nullable: true,
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
            nullable: true 
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