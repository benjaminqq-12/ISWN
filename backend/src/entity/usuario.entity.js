"use strict";
import { EntitySchema } from "typeorm";

const UsuarioSchema = new EntitySchema({
    name: "Usuario",
    tableName: "Usuarios",
    columns: {
        usuarioId: {
            type: "int",
            primary: true,
            generated: true,
        },
        rutUsuario: {
            type: "varchar",
            length: 12,
            nullable: false,
            unique: true,
        },
        usuarioNombre: {
            type: "varchar",
            length: 100,
            nullable: false,
        },
        usuarioEmail: {
            type: "varchar",
            length: 100,
        },
        usuarioPassword: {
            type: "varchar",
            nullable: false,
        }
    }
});

export default UsuarioSchema;