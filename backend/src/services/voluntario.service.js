"use strict";

import { AppDataSource } from "../config/configDb.js";
import VoluntarioSchema from "../entity/voluntario.entity.js";

const voluntarioRepository =
    AppDataSource.getRepository(VoluntarioSchema);

/*
=========================================
CREAR VOLUNTARIO
=========================================
*/

export async function crearVoluntario(datos) {
    try {
        const voluntario = voluntarioRepository.create(datos);

        return await voluntarioRepository.save(voluntario);
    } catch (error) {
        throw error;
    }
}

/*
=========================================
OBTENER TODOS LOS VOLUNTARIOS
=========================================
*/

export async function obtenerVoluntarios() {
    try {
        return await voluntarioRepository.find({
            order: {
                fechaRegistro: "DESC",
            },
        });
    } catch (error) {
        throw error;
    }
}

/*
=========================================
BUSCAR VOLUNTARIO POR ID
=========================================
*/

export async function obtenerVoluntarioPorId(id) {
    try {
        return await voluntarioRepository.findOne({
            where: {
                voluntarioId: Number(id),
            },
        });
    } catch (error) {
        throw error;
    }
}

/*
=========================================
BUSCAR VOLUNTARIO POR RUT
=========================================
*/

export async function obtenerVoluntarioPorRut(rut) {
    try {
        return await voluntarioRepository.findOne({
            where: {
                rut,
            },
        });
    } catch (error) {
        throw error;
    }
}