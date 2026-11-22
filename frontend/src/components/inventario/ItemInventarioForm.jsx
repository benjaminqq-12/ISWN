import { useState } from "react";
import Modal from "../eventos/Modal.jsx";

const CATEGORIAS = [
  { value: "comida", label: "Comida de animales" },
  { value: "medico", label: "Insumos médicos" },
  { value: "limpieza", label: "Insumos de limpieza" },
  { value: "oficina", label: "Artículos de oficina" },
];

// Patrón del registro de Mascotas: form nativo + FormData + defaultValue.
// Solo necesitamos estado para alternar el campo Perros/Gatos al cambiar categoría.
export default function ItemInventarioForm({ item, guardando, error, onSubmit, onClose }) {
  const [categoria, setCategoria] = useState(item?.categoria ?? "comida");

  function enviar(event) {
    event.preventDefault();
    const datos = new FormData(event.currentTarget);
    const payload = {
      nombre: String(datos.get("nombre") || "").trim(),
      categoria,
      subcategoria: categoria === "comida" ? datos.get("subcategoria") : null,
      unidad: datos.get("unidad"),
      descripcion: String(datos.get("descripcion") || "").trim(),
      stockMinimo: Number(datos.get("stockMinimo")),
    };
    if (!item) payload.stockInicial = Number(datos.get("stockInicial"));
    onSubmit(payload);
  }

  return (
    <Modal titulo={item ? "Editar artículo" : "Agregar artículo al inventario"}
      onClose={onClose} bloqueado={guardando}>
      <form className="inventario-form" onSubmit={enviar}>
        <label className="inventario-campo">Nombre del artículo
          <input name="nombre" type="text" minLength={2} maxLength={120} required
            defaultValue={item?.nombre ?? ""} placeholder="Ej.: Alimento seco para gatos" />
        </label>
        <div className="inventario-form-grid">
          <label className="inventario-campo">Categoría
            <select name="categoria" value={categoria} onChange={(event) => setCategoria(event.target.value)}>
              {CATEGORIAS.map((opcion) => <option key={opcion.value} value={opcion.value}>{opcion.label}</option>)}
            </select>
          </label>
          {categoria === "comida" && (
            <label className="inventario-campo">Destinado a
              <select name="subcategoria" defaultValue={item?.categoria === "comida" ? item.subcategoria : "perro"}>
                <option value="perro">Perros</option>
                <option value="gato">Gatos</option>
              </select>
            </label>
          )}
          <label className="inventario-campo">Unidad de medida
            <select name="unidad" defaultValue={item?.unidad ?? "unidad"}>
              <option value="unidad">Unidades</option>
              <option value="kg">Kilogramos (kg)</option>
              <option value="litro">Litros</option>
              <option value="paquete">Paquetes</option>
            </select>
          </label>
          <label className="inventario-campo">Stock mínimo
            <input name="stockMinimo" type="number" min="0" max="9999999999.99" step="0.01" required
              defaultValue={item?.stockMinimo ?? 0} />
          </label>
          {!item && (
            <label className="inventario-campo">Stock inicial
              <input name="stockInicial" type="number" min="0" max="9999999999.99" step="0.01" required defaultValue="0" />
            </label>
          )}
        </div>
        <label className="inventario-campo">Descripción (opcional)
          <textarea name="descripcion" rows={3} maxLength={500} defaultValue={item?.descripcion ?? ""}
            placeholder="Marca, presentación u observaciones" />
        </label>
        {item && <p className="inventario-ayuda">Para modificar cantidades utiliza «Registrar movimiento». Así se conserva el historial.</p>}
        {error && <p className="inventario-error" role="alert">{error}</p>}
        <div className="inventario-modal-acciones">
          <button type="button" className="boton boton-secundario" onClick={onClose} disabled={guardando}>Cancelar</button>
          <button type="submit" className="boton boton-primario" disabled={guardando}>
            {guardando ? "Guardando..." : item ? "Guardar cambios" : "Agregar artículo"}
          </button>
        </div>
      </form>
    </Modal>
  );
}