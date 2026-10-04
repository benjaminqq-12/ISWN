"use strict";

import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";
import {
  crearMascotaService,
  getMascotasService,
  getMascotaService,
  actualizarMascotaService,
  eliminarMascotaService,
} from "../services/mascota.service.js";

const CAMPOS_TEXTO = {
  mascota_nombreCompleto: 100,
  mascota_especie: 100,
  mascota_sexo: 100,
  mascota_viaIngreso: 512,
  mascota_estado: 100,
  mascota_antecedentesPrevios: 512,
};

const OPCIONES_MASCOTA = {
  mascota_especie: ["Perro", "Gato"],
  mascota_sexo: ["Hembra", "Macho"],
  mascota_viaIngreso: ["Entrega voluntaria", "Decomiso municipal", "Traslado", "Hallazgo en vía pública"],
  mascota_estado: ["En Tratamiento", "En Cuarentena", "En adopción"],
};

const CAMPOS_MASCOTA = new Set([
  ...Object.keys(CAMPOS_TEXTO),
  "mascota_edad",
  "mascota_peso",
  "mascota_fotoURL",
]);

function validarDatosMascota(datos) {
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
    return [null, "El cuerpo de la solicitud debe ser un objeto"];
  }

  const campoNoPermitido = Object.keys(datos).find((campo) => !CAMPOS_MASCOTA.has(campo));
  if (campoNoPermitido) {
    return [null, `El campo ${campoNoPermitido} no está permitido`];
  }

  const datosValidados = {};
  for (const [campo, maxLength] of Object.entries(CAMPOS_TEXTO)) {
    const valor = datos[campo];
    if (typeof valor !== "string" || !valor.trim() || valor.trim().length > maxLength) {
      return [null, `El campo ${campo} es obligatorio y debe tener hasta ${maxLength} caracteres`];
    }
    datosValidados[campo] = valor.trim();
  }

  for (const [campo, opciones] of Object.entries(OPCIONES_MASCOTA)) {
    if (!opciones.includes(datosValidados[campo])) {
      return [null, `El campo ${campo} debe ser una de estas opciones: ${opciones.join(", ")}`];
    }
  }

  if (!Number.isInteger(datos.mascota_edad) || datos.mascota_edad < 0) {
    return [null, "La edad debe ser un número entero mayor o igual a cero"];
  }
  if (typeof datos.mascota_peso !== "number" || !Number.isFinite(datos.mascota_peso) || datos.mascota_peso <= 0) {
    return [null, "El peso debe ser un número mayor que cero"];
  }

  const foto = datos.mascota_fotoURL;
  if (foto !== undefined && foto !== null && typeof foto !== "string") {
    return [null, "La URL de la foto debe ser un texto de hasta 512 caracteres"];
  }
  if (typeof foto === "string" && foto.trim().length > 512) {
    return [null, "La URL de la foto debe tener hasta 512 caracteres"];
  }

  datosValidados.mascota_edad = datos.mascota_edad;
  datosValidados.mascota_peso = datos.mascota_peso;
  datosValidados.mascota_fotoURL = typeof foto === "string" ? foto.trim() || null : null;
  return [datosValidados, null];
}

function obtenerIdMascota(req, res) {
  const idTexto = req.params.id;
  const id = Number(idTexto);
  if (!/^\d+$/.test(idTexto) || !Number.isSafeInteger(id) || id < 1 || id > 2147483647) {
    handleErrorClient(res, 400, "El ID de la mascota debe ser un entero positivo válido");
    return null;
  }
  return id;
}

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

export async function getMascotaController(req, res) {
  const id = obtenerIdMascota(req, res);
  if (id === null) return;

  const [mascota, error] = await getMascotaService(id);
  if (error) {
    if (error === "Mascota no encontrada") return handleErrorClient(res, 404, error);
    return handleErrorServer(res, 500, error);
  }

  const mascotaPublica = {
    mascota_id: mascota.mascota_id,
    mascota_nombreCompleto: mascota.mascota_nombreCompleto,
    mascota_especie: mascota.mascota_especie,
    mascota_edad: mascota.mascota_edad,
    mascota_peso: mascota.mascota_peso,
    mascota_sexo: mascota.mascota_sexo,
    mascota_estado: mascota.mascota_estado,
    mascota_fotoURL: mascota.mascota_fotoURL,
  };
  return handleSuccess(res, 200, "Mascota encontrada", mascotaPublica);
}

export async function getMascotaInternaController(req, res) {
  const id = obtenerIdMascota(req, res);
  if (id === null) return;

  const [mascota, error] = await getMascotaService(id);
  if (error) {
    if (error === "Mascota no encontrada") return handleErrorClient(res, 404, error);
    return handleErrorServer(res, 500, error);
  }
  return handleSuccess(res, 200, "Datos internos de la mascota", mascota);
}

export async function crearMascotaController(req, res) {
  const [datosMascota, errorValidacion] = validarDatosMascota(req.body);
  if (errorValidacion) return handleErrorClient(res, 400, errorValidacion);

  const [mascota, error] = await crearMascotaService(datosMascota);
  if (error) return handleErrorServer(res, 500, error);
  return handleSuccess(res, 201, "Mascota registrada exitosamente", mascota);
}

export async function actualizarMascotaController(req, res) {
  const id = obtenerIdMascota(req, res);
  if (id === null) return;

  const [datosActualizados, errorValidacion] = validarDatosMascota(req.body);
  if (errorValidacion) return handleErrorClient(res, 400, errorValidacion);

  const [mascotaActualizada, error] = await actualizarMascotaService(id, datosActualizados);
  if (error) {
    if (error === "Mascota no encontrada") {
      return handleErrorClient(res, 404, error);
    }
    return handleErrorServer(res, 500, error);
  }

  return handleSuccess(res, 200, "Mascota actualizada exitosamente", mascotaActualizada);
}

export async function eliminarMascotaController(req, res) {
  const id = obtenerIdMascota(req, res);
  if (id === null) return;

  const [mascotaEliminada, error] = await eliminarMascotaService(id);
  if (error) {
    if (error === "Mascota no encontrada") {
      return handleErrorClient(res, 404, error);
    }
    if (error === "No se puede eliminar la mascota porque tiene registros relacionados") {
      return handleErrorClient(res, 409, error);
    }
    return handleErrorServer(res, 500, error);
  }
  return handleSuccess(res, 200, "Mascota eliminada exitosamente", mascotaEliminada);
}


