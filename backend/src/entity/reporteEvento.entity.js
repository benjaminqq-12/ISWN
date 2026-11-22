import { EntitySchema } from "typeorm";

const ReporteEventoSchema = new EntitySchema({
    name: "ReporteEvento",
    tableName: "ReportesEventos",
    columns: {
        reporteId: { 
            type: "int", 
            primary: true,
             generated: true 
        },
        totalInscritos: { 
            type: "int",
            default: 0, 
            nullable: false 
        },
        totalAsistentes: { 
            type: "int", 
            default: 0, 
            nullable: false 
        },
        porcentajeAsistencia: { 
            type: "float", 
            default: 0, 
            nullable: false 
        },
        observaciones: { 
            type: "text", 
            default: "", 
            nullable: false 
        },
        fechaGeneracion: { 
            type: "timestamptz", 
            createDate: true 
        },
    },
    relations: {
        evento: {
            type: "many-to-one",
            target: "Evento",
            joinColumn: { name: "eventoId" },
            nullable: false,
            onDelete: "CASCADE",
        },
        creadoPor: {
            type: "many-to-one",
            target: "Usuario",
            joinColumn: { name: "usuarioId" },
            nullable: true,
            onDelete: "SET NULL",
        },
    },
});

export default ReporteEventoSchema;


