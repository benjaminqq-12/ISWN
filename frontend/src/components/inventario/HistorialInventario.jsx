import Modal from "../eventos/Modal.jsx";

export default function HistorialInventario({ item, movimientos, cargando, error, onClose }) {
  return (
    <Modal titulo={`Historial · ${item.nombre}`} onClose={onClose} ancho="modal-historial-inventario">
      <p className="inventario-ayuda">Últimos 100 movimientos, ordenados del más reciente al más antiguo.</p>
      {cargando ? <p role="status">Cargando movimientos...</p> : error ? (
        <p className="inventario-error" role="alert">{error}</p>
      ) : movimientos.length === 0 ? (
        <p className="inventario-vacio">Este artículo aún no tiene movimientos.</p>
      ) : (
        <div className="inventario-tabla-contenedor">
          <table className="inventario-tabla" aria-label={`Historial de movimientos de ${item.nombre}`}>
            <colgroup>
              <col style={{ width: "24%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "21%" }} />
              <col style={{ width: "30%" }} />
            </colgroup>
            <thead><tr><th>Fecha</th><th>Tipo</th><th>Cantidad</th><th>Responsable</th><th>Motivo</th></tr></thead>
            <tbody>{movimientos.map((m) => (
              <tr key={m.movimientoId}>
                <td data-label="Fecha">{new Date(m.fecha).toLocaleString("es-CL")}</td>
                <td data-label="Tipo">{m.tipo === "entrada" ? "Entrada" : "Salida"}</td>
                <td className="inventario-cantidad" data-label="Cantidad">{m.tipo === "entrada" ? "+" : "−"}{Number(m.cantidad).toLocaleString("es-CL")}</td>
                <td data-label="Responsable">{m.responsable}</td>
                <td data-label="Motivo">{m.motivo}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
