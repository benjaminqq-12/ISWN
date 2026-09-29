const API_URL = "http://localhost:3000/api";

export async function getMascotas() {
  const response = await fetch(`${API_URL}/mascotas`);

  if (!response.ok) {
    throw new Error("Error al obtener las mascotas");
  }

  const { data } = await response.json();
  return data;
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
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "No se pudo registrar la mascota");
  }

  return result.data;
}