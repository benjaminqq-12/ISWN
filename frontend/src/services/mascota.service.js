const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export async function getMascotas() {
  const response = await fetch(`${API_URL}/mascotas`);

  if (!response.ok) {
    throw new Error("Error al obtener las mascotas");
  }

  const { data } = await response.json();
  return data;
}