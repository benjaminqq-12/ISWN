"use strict";

import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";
import {
  crearMascotaService,
  getMascotasService,
} from "../services/mascota.service.js";

export async function getMascotasController(req, res) {
  try {
    const [mascotas, error] = await getMascotasService();
    if (error) return handleErrorClient(res, 404, error);
    return handleSuccess(res, 200, "Mascotas encontradas", mascotas);
  } catch (error) {
    console.error("Error en getMascotasController:", error);
    return handleErrorServer(res, 500, "Error interno del servidor");
  }
}

export async function crearMascotaController(req, res) {
  const {
    mascota_nombreCompleto,
    mascota_especie,
    mascota_edad,
    mascota_peso,
    mascota_sexo,
    mascota_viaIngreso,
    mascota_estado,
    mascota_antecedentesPrevios,
    mascota_fotoURL,
  } = req.body || {};

  const camposTexto = [
    ["mascota_nombreCompleto", mascota_nombreCompleto, 100],
    ["mascota_especie", mascota_especie, 100],
    ["mascota_sexo", mascota_sexo, 100],
    ["mascota_viaIngreso", mascota_viaIngreso, 512],
    ["mascota_estado", mascota_estado, 100],
    ["mascota_antecedentesPrevios", mascota_antecedentesPrevios, 512],
  ];

  for (const [nombre, valor, maxLength] of camposTexto) {
    if (typeof valor !== "string" || !valor.trim() || valor.trim().length > maxLength) {
      return handleErrorClient(
        res,
        400,
        `El campo ${nombre} es obligatorio y debe tener hasta ${maxLength} caracteres`
      );
    }
  }

  const opcionesPermitidas = [
    ["mascota_especie", mascota_especie, ["Perro", "Gato"]],
    ["mascota_sexo", mascota_sexo, ["Hembra", "Macho"]],
    [
      "mascota_viaIngreso",
      mascota_viaIngreso,
      ["Entrega voluntaria", "Decomiso municipal", "Traslado", "Hallazgo en vía pública"],
    ],
    ["mascota_estado", mascota_estado, ["En Tratamiento", "En Cuarentena", "En adopción"]],
  ];

  for (const [nombre, valor, opciones] of opcionesPermitidas) {
    if (!opciones.includes(valor.trim())) {
      return handleErrorClient(
        res,
        400,
        `El campo ${nombre} debe ser una de estas opciones: ${opciones.join(", ")}`
      );
    }
  }

  if (!Number.isInteger(mascota_edad) || mascota_edad < 0) {
    return handleErrorClient(res, 400, "La edad debe ser un número entero mayor o igual a cero");
  }

  if (typeof mascota_peso !== "number" || !Number.isFinite(mascota_peso) || mascota_peso <= 0) {
    return handleErrorClient(res, 400, "El peso debe ser un número mayor que cero");
  }

  if (
    mascota_fotoURL !== undefined &&
    mascota_fotoURL !== null &&
    (typeof mascota_fotoURL !== "string" || mascota_fotoURL.length > 512)
  ) {
    return handleErrorClient(res, 400, "La URL de la foto debe tener hasta 512 caracteres");
  }

  const datosMascota = Object.fromEntries(
    camposTexto.map(([nombre, valor]) => [nombre, valor.trim()])
  );
  datosMascota.mascota_edad = mascota_edad;
  datosMascota.mascota_peso = mascota_peso;
  datosMascota.mascota_fotoURL = mascota_fotoURL?.trim() || null;

  const [mascota, error] = await crearMascotaService(datosMascota);
  if (error) return handleErrorServer(res, 500, error);
  return handleSuccess(res, 201, "Mascota registrada exitosamente", mascota);
}
