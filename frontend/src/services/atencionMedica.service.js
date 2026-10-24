import axios from "./root.service.js";

export async function registrarAtencionMedica(datosAtencion) {
  try {
    const response = await axios.post("/atenciones-medicas", datosAtencion);
    if (response.data?.status !== "Success") {
      throw new Error(response.data?.message || "No se pudo registrar la atención médica.");
    }
    return response.data.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message
        || error.message
        || "Error de conexión con el servidor.",
      { cause: error }
    );
  }
}
