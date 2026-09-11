"use strict";
import { EntitySchema } from "typeorm";

const UsuarioSchema = new EntitySchema({
    name: "Usuario",
    tableName: "usuarios",
    columns: {
        usuarioId: {
            type: "int",
            primary: true,
            generated: true,
        },
        nombre: {
            type: "varchar",
            length: 100,
            nullable: false,
        },
        email: {
            type: "varchar",
            length: 100,
        }
    }
});

export default UsuarioSchema;