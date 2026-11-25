"use strict";

import { AppDataSource } from "../config/configDb.js";
import VoluntarioSchema from "../entity/voluntario.entity.js";

const voluntarioRepository = AppDataSource.getRepository(VoluntarioSchema);

export async function crearVoluntario(datos) {
    return await voluntarioRepository.save(voluntarioRepository.create(datos));
}

export async function obtenerVoluntarios() {
    return await voluntarioRepository.find({ order: { fechaRegistro: "DESC" } });
}

export async function obtenerVoluntarioPorId(id) {
    return await voluntarioRepository.findOne({ where: { voluntarioId: Number(id) } });
}

export async function obtenerVoluntarioPorRut(rut) {
    return await voluntarioRepository.findOne({ where: { rut } });
}

export async function obtenerVoluntarioPorEmail(email) {
    const correoNormalizado = email.trim().toLowerCase();
    return await voluntarioRepository.createQueryBuilder("voluntario")
        .where("LOWER(TRIM(voluntario.email)) = :email", { email: correoNormalizado })
        .getOne();
}
