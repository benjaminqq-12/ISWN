"use strict";

import { EntitySchema } from "typeorm";

const InvitacionVoluntarioSchema = new EntitySchema({
  name: "InvitacionVoluntario",
  tableName: "InvitacionesVoluntarios",

  columns: {
    invitacionId: {
      type: "int",
      primary: true,
      generated: true,
    },

    voluntarioId: {
      type: "int",
      nullable: false,
    },

    tokenHash: {
      type: "varchar",
      length: 64,
      nullable: false,
      unique: true,
    },

    fechaExpiracion: {
      type: "timestamp",
      nullable: false,
    },

    utilizada: {
      type: "boolean",
      default: false,
      nullable: false,
    },
  },

  indices: [
    {
      name: "IDX_INVITACION_VOLUNTARIO",
      columns: ["voluntarioId"],
    },
  ],
});

export default InvitacionVoluntarioSchema;
