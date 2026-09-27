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
        rut: {
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
        },

        // integración de los campos de voluntario
        rol: {
            type: "varchar",
            length: 15,
            nullable: false,
            default: "Usuario", //valores posibles: "Usuario", "Voluntario", "Admin"
        },
        activo: {
            type: "boolean",
            default: true,
            nullable: false,
        }
    },
    // indice para acelerar la busqueda de personal vigente
    indices: [
        {
            name: "IDX_USUARIO_ROL_ACTIVO",
            columns: ["rol", "activo"]
        }
    ]
});

export default UsuarioSchema;