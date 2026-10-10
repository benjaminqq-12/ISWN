const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export async function crearSolicitudAdopcion({ mascotaId, usuarioAdoptanteId }) {
  const response = await fetch(`${API_URL}/solicitudes-adopcion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mascotaId, usuarioAdoptanteId }),
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.message || "Error al enviar la solicitud de adopción");
  }

  return body.data;
}

export async function getSolicitudes() {
  const response = await fetch(`${API_URL}/solicitudes-adopcion`);
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.message || "Error al obtener las solicitudes");
  }
  return body.data;
}

export async function avanzarEstadoSolicitud(id, { nuevoEstado, detalle, usuarioId }) {
  const response = await fetch(`${API_URL}/solicitudes-adopcion/${id}/estado`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nuevoEstado, detalle, usuarioId }),
  });

  const body = await response.json();
  if (!response.ok) {
    throw new Error(body.message || "Error al actualizar el estado de la solicitud");
  }
  return body.data;
}