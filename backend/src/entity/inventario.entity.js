"use strict";
import { EntitySchema } from "typeorm";

// Las cantidades DECIMAL permiten registrar kg y litros fraccionarios.
const InventarioSchema = new EntitySchema({
  name: "Inventario",
  tableName: "Inventario",
  columns: {
    inventarioId: { 
        type: "int", 
        primary: true, 
        generated: true 
    },
    nombre: { 
        type: "varchar", 
        length: 120, 
        nullable: false 
    },
    categoria: { 
        type: "varchar", 
        length: 20, 
        nullable: false 
    },
    subcategoria: { 
        type: "varchar", 
        length: 20, 
        nullable: true 
     },
    unidad: { 
        type: "varchar", 
        length: 20, 
        nullable: false, 
        default: "unidad" 
    },
    descripcion: { 
        type: "varchar", 
        length: 500, 
        nullable: true 
    },
    stock: { 
        type: "decimal", 
        precision: 12, 
        scale: 2, 
        nullable: false, 
        default: 0 
    },
    stockMinimo: { 
        type: "decimal", 
        precision: 12, 
        scale: 2, 
        nullable: false, 
        default: 0 
    },
    creadoEn: { 
        type: "timestamp", 
        createDate: true 
    },
    actualizadoEn: { 
        type: "timestamp", 
        updateDate: true 
    },
  },
  indices: [
    { name: "IDX_INVENTARIO_CATEGORIA", columns: ["categoria", "subcategoria"] },
  ],
});

export default InventarioSchema;
