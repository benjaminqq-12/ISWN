const API_URL = "http://localhost:3000/api";

async function leerRespuesta(response, mensajeError) {
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.message || mensajeError);
  }
  return result.data;
}

export async function getMascotas() {
  const response = await fetch(`${API_URL}/mascotas`);
  return leerRespuesta(response, "Error al obtener las mascotas");
}

export async function getMascota(id) {
  const response = await fetch(`${API_URL}/mascotas/${id}`);
  return leerRespuesta(response, "No se pudo obtener la mascota");
}

export async function getMascotaInterna(id, token) {
  const response = await fetch(`${API_URL}/mascotas/${id}/interno`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return leerRespuesta(response, "No se pudieron obtener los datos internos");
}

export async function iniciarSesion(usuarioEmail, usuarioPassword) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ usuarioEmail, usuarioPassword }),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "No se pudo iniciar sesión");
  }

  return result.data;
}

export async function crearMascota(mascota, token) {
  const response = await fetch(`${API_URL}/mascotas`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(mascota),
  });
  return leerRespuesta(response, "No se pudo registrar la mascota");
}

export async function actualizarMascota(id, mascota, token) {
  const response = await fetch(`${API_URL}/mascotas/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(mascota),
  });
  return leerRespuesta(response, "No se pudo actualizar la mascota");
}

export async function eliminarMascota(id, token) {
  const response = await fetch(`${API_URL}/mascotas/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return leerRespuesta(response, "No se pudo eliminar la mascota");
}