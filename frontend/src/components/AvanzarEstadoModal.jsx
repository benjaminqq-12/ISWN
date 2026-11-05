import { useState } from 'react';
import { avanzarEstadoSolicitud } from '../services/solicitudAdopcion.service';
import '../styles/mascotas.css';
import '../styles/solicitudes.css';

const MAX_DETALLE = 512;

// Deben coincidir con el backend (src/config/estadosSolicitud.js)
const ESTADO_CANCELADA = "Cancelada";
const TIPOS_CIERRE = [
  "Desistimiento del adoptante",
  "Rechazada por el refugio",
  "Devolución de la mascota",
];

const AvanzarEstadoModal = ({ solicitud, onClose, onSuccess }) => {
  const [nuevoEstado, setNuevoEstado] = useState(solicitud.siguientesEstados[0]);
  const [tipoCierre, setTipoCierre] = useState('');
  const [detalle, setDetalle] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const cancelando = nuevoEstado === ESTADO_CANCELADA;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cancelando && !tipoCierre) {
      setError("Selecciona el tipo de cierre.");
      return;
    }
    if (!detalle.trim()) {
      setError("Debes adjuntar un detalle de cómo procedió este paso.");
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      await avanzarEstadoSolicitud(solicitud.solicitudAdopcion_id, {
        nuevoEstado,
        detalle: detalle.trim(),
        tipoCierre: cancelando ? tipoCierre : undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const mascota = solicitud.solicitudAdopcion_mascotaAdoptada;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content sol-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Avanzar solicitud #{solicitud.solicitudAdopcion_id}</h2>
        <p>
          {mascota?.mascota_nombreCompleto} · estado actual:{" "}
          <strong>{solicitud.solicitudAadopcion_estado}</strong>
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="nuevoEstado">Nuevo estado</label>
          <select id="nuevoEstado" value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value)}>
            {solicitud.siguientesEstados.map((estado) => (
              <option key={estado} value={estado}>{estado}</option>
            ))}
          </select>

          {cancelando && (
            <>
              <label htmlFor="tipoCierre">Tipo de cierre</label>
              <select id="tipoCierre" value={tipoCierre} onChange={(e) => setTipoCierre(e.target.value)}>
                <option value="">-- Selecciona un tipo de cierre --</option>
                {TIPOS_CIERRE.map((tipo) => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </>
          )}

          <label htmlFor="detalle">
            {cancelando ? "Motivo de la cancelación" : "Detalle de cómo procedió el paso"}
          </label>
          <textarea
            id="detalle"
            value={detalle}
            maxLength={MAX_DETALLE}
            onChange={(e) => setDetalle(e.target.value)}
          />
          <span className="sol-contador">{detalle.length}/{MAX_DETALLE}</span>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={enviando}>Cancelar</button>
            <button type="submit" disabled={enviando}>
              {enviando ? "Guardando..." : "Confirmar avance"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AvanzarEstadoModal;