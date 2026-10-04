"use strict";
import { EntitySchema } from "typeorm";

const VeterinarioSchema = new EntitySchema({
    name: "Veterinario",
    tableName: "veterinarios",
    columns: {
        veterinario_id: {
            type: "int",
            primary: true,
            generated: true
        },
        veterinario_especialidad: {
            type: "varchar",
            length: 100,
            nullable: true
        },
        veterinario_registroProfesional: {
            type: "varchar",
            length: 50,
            nullable: true,
            unique: true
        }
    },
    relations: {
        usuario: {
            type: "one-to-one",
            target: "Usuario",
            joinColumn: {
                name: "usuario_id"
            },
            nullable: false,
            onDelete: "CASCADE"
        }
    }
});

export default VeterinarioSchema;