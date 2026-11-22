import Modal from "../eventos/Modal.jsx";

export default function HistorialInventario({ item, movimientos, cargando, error, onClose }) {
  return (
    <Modal titulo={`Historial · ${item.nombre}`} onClose={onClose}>
      <p className="inventario-ayuda">Últimos 100 movimientos, ordenados del más reciente al más antiguo.</p>
      {cargando ? <p role="status">Cargando movimientos...</p> : error ? (
        <p className="inventario-error" role="alert">{error}</p>
      ) : movimientos.length === 0 ? (
        <p className="inventario-vacio">Este artículo aún no tiene movimientos.</p>
      ) : (
        <div className="inventario-tabla-contenedor">
          <table className="inventario-tabla">
            <thead><tr><th>Fecha</th><th>Tipo</th><th>Cantidad</th><th>Responsable</th><th>Motivo</th></tr></thead>
            <tbody>{movimientos.map((m) => (
              <tr key={m.movimientoId}>
                <td>{new Date(m.fecha).toLocaleString("es-CL")}</td>
                <td>{m.tipo === "entrada" ? "Entrada" : "Salida"}</td>
                <td className="inventario-cantidad">{m.tipo === "entrada" ? "+" : "−"}{Number(m.cantidad).toLocaleString("es-CL")}</td>
                <td>{m.responsable}</td>
                <td>{m.motivo}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
