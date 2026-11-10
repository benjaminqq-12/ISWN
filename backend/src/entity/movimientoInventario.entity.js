"use strict";
import { EntitySchema } from "typeorm";

const MovimientoInventarioSchema = new EntitySchema({
  name: "MovimientoInventario",
  tableName: "MovimientosInventario",
  columns: {
    movimientoId: { 
        type: "int", 
        primary: true, 
        generated: true 
    },
    tipo: { 
        type: "varchar", 
        length: 10, 
        nullable: false 
    }, // entrada / salida
    cantidad: { 
        type: "decimal", 
        precision: 12, 
        scale: 2, 
        nullable: false 
    },
    motivo: { 
        type: "varchar", 
        length: 200, 
        nullable: false 
    },
    fecha: { 
        type: "timestamp", 
        createDate: true 
    },
  },
  relations: {
    inventario: {
      type: "many-to-one", 
      target: "Inventario",
      joinColumn: { name: "inventarioId" }, 
      nullable: false, 
      onDelete: "RESTRICT",
    },
    usuario: {
      type: "many-to-one", 
      target: "Usuario",
      joinColumn: { name: "usuarioId" }, 
      nullable: false, 
      onDelete: "RESTRICT",
    },
  },
  indices: [{ name: "IDX_MOVIMIENTOS_INVENTARIO", columns: ["inventario"] }],
});

export default MovimientoInventarioSchema;