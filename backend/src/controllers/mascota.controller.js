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
  getMascotaPublicaService,
  actualizarMascotaService,
  eliminarMascotaService,
  revisarMascotasLoteService,
  eliminarMascotasLoteService,
} from "../services/mascota.service.js";

import {
  mascotaBodyValidation,
  mascotaUpdateValidation,
  mascotaIdValidation,
  mascotaLoteValidation,
  mascotaLoteEliminarValidation,
} from "../validations/mascota.validations.js";


// Obtener listado público de mascotas
export async function getMascotasController(req, res) {
  try {
    const [mascotas, error] = await getMascotasService(true);

    if (error) return handleErrorClient(res, 500, error);

    return handleSuccess(res, 200, "Mascotas encontradas", mascotas);
  } catch (error) {
    console.error("Error en getMascotasController:", error);

    return handleErrorServer(res, 500, "Error interno del servidor");
  }
}

// Obtener perfil público de una mascota
export async function getMascotaController(req, res) {
  try {
    const { error: errorId, value: params} = mascotaIdValidation.validate(req.params);
    if (errorId) {
      return handleErrorClient(res, 400, errorId.details[0].message);
    }

    const [mascota, error] = await getMascotaPublicaService(params.id);

    if (error) {
      if (error === "Mascota no encontrada" || error === "Mascota no disponible públicamente") {
        return handleErrorClient(res, 404, "Mascota no encontrada");
      }
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
  } catch (error) {
    console.error("Error en getMascotaController:", error);
    return handleErrorServer(res, 500, "Error interno del servidor");
  }
  
}

// Obtener listado completo para personal interno
export async function getMascotasInternasController(req, res) {
  try {
    const [mascotas, error] = await getMascotasService(false);

    if (error) {
      return handleErrorServer(res, 500, error);
    }

    return handleSuccess(res, 200, "Mascotas internas encontradas", mascotas);
  } catch (error) {
    console.error("Error al obtener mascotas internas:", error);
    return handleErrorServer(res, 500, "Error interno del servidor");
  }
}

// Obtener información interna de una mascota
export async function getMascotaInternaController(req, res) {

  try {
    const { error: errorId, value: params} = mascotaIdValidation.validate(req.params);
    if (errorId) {
      return handleErrorClient(res, 400, errorId.details[0].message);
    }

    const [mascota, error] = await getMascotaService(params.id);

    if (error) {
      if (error === "Mascota no encontrada") {
        return handleErrorClient(res, 404, error);
      }
      return handleErrorServer(res, 500, error);
    }
    return handleSuccess(res, 200, "Datos internos de la mascota", mascota);
  } catch (error) {
    console.error("Error en getMascotaInternaController:", error);
    return handleErrorServer(res, 500, "Error interno del servidor");
  }
}

// Registrar mascota
export async function crearMascotaController(req, res) {
  try {
    const { error: errorBody, value: datosMascota } = mascotaBodyValidation.validate(req.body);
    if (errorBody) {
      return handleErrorClient(res, 400, errorBody.details[0].message);
    }

    const [mascota, error] = await crearMascotaService(datosMascota);

    if (error) {
      return handleErrorServer(res, 500, error);
    }
    return handleSuccess(res, 201, "Mascota registrada exitosamente", mascota);
  } catch (error) {
    console.error("Error en crearMascotaController:", error);
    return handleErrorServer(res, 500, "Error interno del servidor");
  }
}

// Actualizar mascota
export async function actualizarMascotaController(req, res) {
  try {
    const { error: errorId, value: params } = mascotaIdValidation.validate(req.params);
    if (errorId) {
      return handleErrorClient(res, 400, errorId.details[0].message);
    }

    const { error: errorBody, value: datosActualizados } = mascotaUpdateValidation.validate(req.body);
    if (errorBody) {
      return handleErrorClient(res, 400, errorBody.details[0].message);
    }

    const [mascotaActualizada, error] = await actualizarMascotaService(params.id, datosActualizados);

    if (error) {
      if (error === "Mascota no encontrada") {
        return handleErrorClient(res, 404, error);
      }
      if (
        error ===
        "El estado sanitario solo puede ser modificado por un Veterinario mediante la ruta correspondiente"
      ) {
        return handleErrorClient(res, 403, error);
      }
      return handleErrorServer(res, 500, error);
    }
    return handleSuccess(res, 200, "Mascota actualizada exitosamente", mascotaActualizada);
  } catch (error) {
    console.error("Error en actualizarMascotaController:", error);
    return handleErrorServer(res, 500, "Error interno del servidor");
  }
}

// Eliminar mascota
export async function eliminarMascotaController(req, res) {
  try {
    const { error: errorId, value: params } = mascotaIdValidation.validate(req.params);
    if (errorId) {
      return handleErrorClient(res, 400, errorId.details[0].message);
    }
    
    const [mascotaEliminada, error] = await eliminarMascotaService(params.id);
    
    if (error) {
      if (error === "Mascota no encontrada") {
        return handleErrorClient(res, 404, error);
      }

      if (
        error ===
        "No se puede eliminar la mascota porque tiene registros relacionados"
      ) {
        return handleErrorClient(res, 409, error);
      }

      return handleErrorServer(res, 500, error);
    }

    return handleSuccess(res, 200, "Mascota eliminada exitosamente", mascotaEliminada);
  } catch (error) {
    console.error("Error en eliminarMascotaController:", error);
    return handleErrorServer(res, 500, "Error interno del servidor");
  }
}

export async function revisarMascotasLoteController(req, res) {
  try {
    const { error, value } = mascotaLoteValidation.validate(req.body);
    if (error) {
      return handleErrorClient(res, 400, error.details[0].message);
    }

    const [resultado,  fallo] = await revisarMascotasLoteService(value.ids);

    if (fallo) {
      if (fallo.statusCode >= 500) {
        return handleErrorServer(res, fallo.statusCode, fallo.message);
      }
      return handleErrorClient(res, fallo.statusCode, fallo.message, fallo.details);
    }

    return handleSuccess(res, 200, "Revisión de mascotas completada", resultado);
  } catch (error) {
    console.error("Error en revisarMascotasLoteController:", error);
    return handleErrorServer(res, 500, "Error interno del servidor");
  }
}

//eliminar mas de 1 mascota
export async function eliminarMascotasLoteController(req, res) {
  try {
    // 1. Validar los datos recibidos utilizando Joi.
    const { error, value } =
      mascotaLoteEliminarValidation.validate(req.body, {
        abortEarly: false,
      });

    if (error) {
      return handleErrorClient(
        res,
        400,
        error.details
          .map((detalle) => detalle.message)
          .join(" ")
      );
    }

    // 2. Enviar al service el objeto completo validado.
    const [resultado, fallo] =
      await eliminarMascotasLoteService(value);

    // 3. Controlar los errores del service.
    if (fallo) {
      if (fallo.statusCode >= 500) {
        return handleErrorServer(
          res,
          fallo.statusCode,
          fallo.message
        );
      }

      return handleErrorClient(
        res,
        fallo.statusCode,
        fallo.message,
        fallo.details ?? {}
      );
    }

    // 4. Responder con el resumen de eliminación.
    return handleSuccess(
      res,
      200,
      resultado.mensaje,
      resultado
    );

  } catch (error) {
    console.error(
      "Error en eliminarMascotasLoteController:",
      error
    );

    return handleErrorServer(
      res,
      500,
      "Error interno del servidor"
    );
  }
}




