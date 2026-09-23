"use strict";
import { EntitySchema } from "typeorm";

const UsuarioSchema = new EntitySchema({
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
    }
});

export default UsuarioSchema;