const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function getToken() {
  try {
    return JSON.parse(localStorage.getItem("sesion") || "null")?.token ?? null;
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const body = await response.json().catch(() => ({}));

  if (response.status === 401) {
    localStorage.removeItem("sesion");
    throw new Error("Tu sesión expiró o no has iniciado sesión. Inicia sesión nuevamente.");
  }
  if (response.status === 403) {
    throw new Error("No tienes permisos para realizar esta acción.");
  }
  if (!response.ok) {
    throw new Error(body.message || "Ocurrió un error al comunicarse con el servidor.");
  }

  return body.data;
}

export function getHistorialMascota(mascotaId) {
  return request(`/mascotas/${mascotaId}/historial`);
}

export function agregarEventoHistorial(mascotaId, { tipoEvento, descripcion }) {
  return request(`/mascotas/${mascotaId}/historial`, {
    method: "POST",
    body: JSON.stringify({ tipoEvento, descripcion }),
  });
}

export function cambiarEstadoMascota(mascotaId, { nuevoEstado, detalle }) {
  return request(`/mascotas/${mascotaId}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ nuevoEstado, detalle }),
  });
}