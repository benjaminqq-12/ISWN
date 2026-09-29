const API_URL = "http://localhost:3000/api";

export async function getUsuarios() {
  const response = await fetch(`${API_URL}/usuarios`);
  if (!response.ok) throw new Error("Error al obtener los usuarios");
  const { data } = await response.json();
  return data;
}