const API_URL = "http://localhost:3000/api";

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