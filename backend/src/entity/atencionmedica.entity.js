"use strict";

import { EntitySchema } from "typeorm";

const AtencionMedicaSchema = new EntitySchema({
    name: "AtencionMedica",
    tableName: "atenciones_medicas",
    columns: {
        atencion_id: {
            type: "int",
            primary: true,
            generated: true
        },
        atencion_tipo: {
            type: "enum",
            enum: ["PREVENTIVA", "URGENCIA"],
            nullable: false
        },
        atencion_diagnostico: {
            type: "text",
            nullable: false
        },
        atencion_tratamiento: {
            type: "text",
            nullable: false
        },
        atencion_observaciones: {
            type: "text",
            nullable: true
        },
        atencion_fecha: {
            type: "timestamp",
            default: () => "CURRENT_TIMESTAMP"
        }
    },
    relations: {
        mascota: {
            type: "many-to-one",
            target: "Mascota",
            joinColumn: {
                name: "mascota_id"
            },
            nullable: false
        },
        veterinario: {
            type: "many-to-one",
            target: "Veterinario",
            joinColumn: {
                name: "veterinario_id"
            },
            nullable: false
        }
    }
});
export default AtencionMedicaSchema;