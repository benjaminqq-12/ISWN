import { useState } from "react";
import Modal from "../eventos/Modal.jsx";

export default function MovimientoInventarioForm({ item, guardando, error, onSubmit, onClose }) {
  const [tipo, setTipo] = useState("entrada");
  const [errorLocal, setErrorLocal] = useState(null);


  function enviar(event) {
    event.preventDefault();
    setErrorLocal("");
    const datos = new FormData(event.currentTarget);
    const cantidad = Number(datos.get("cantidad"));
    const motivo = String(datos.get("motivo") || "").trim();

    if(!Number.isFinite(cantidad) || cantidad <= 0) {
      setErrorLocal("La cantidad debe ser un número positivo.");
      return;
    }

    if(!/\p{L}/u.test(motivo)) {
      setErrorLocal("El motivo debe contener al menos una letra.");
      return;
    }
    onSubmit({
      tipo,
      cantidad, 
      motivo, 
    });
  }

  return (
    <Modal titulo={`Registrar movimiento · ${item.nombre}`} onClose={onClose} bloqueado={guardando}>
      <form className="inventario-form" onSubmit={enviar}>
        <p className="inventario-ayuda">Stock disponible: <strong>{Number(item.stock).toLocaleString("es-CL")} {item.unidad}</strong>.</p>
        <div className="inventario-form-grid">
          <label className="inventario-campo">Tipo de movimiento
            <select name="tipo" value={tipo} onChange={(event) => setTipo(event.target.value)}>
              <option value="entrada">Entrada de stock</option>
              <option value="salida">Salida de stock</option>
            </select>
          </label>
          <label className="inventario-campo">Cantidad ({item.unidad})
            <input name="cantidad" type="number" min="0.01" max="9999999999.99" step="0.01" defaultValue="1" required />
          </label>
        </div>
        <label className="inventario-campo">Motivo del movimiento
          <input name="motivo" type="text" required minLength={3} maxLength={200}
            placeholder={tipo === "entrada" ? "Ej.: Donación de alimentos" : "Ej.: Alimentación diaria"} />
        </label>
        {errorLocal && (<p className="inventario-error" role="alert">{errorLocal}</p>)}
        {error && <p className="inventario-error" role="alert">{error}</p>}
        <div className="inventario-modal-acciones">
          <button type="button" className="boton boton-secundario" onClick={onClose} disabled={guardando}>Cancelar</button>
          <button className="boton boton-primario" type="submit" disabled={guardando}>
            {guardando ? "Registrando..." : "Registrar movimiento"}
          </button>
        </div>
      </form>
    </Modal>
  );
}