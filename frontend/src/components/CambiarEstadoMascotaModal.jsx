import { useState } from 'react';
import { cambiarEstadoMascota } from '../services/historialMascota.service';
import '../styles/mascotas.css';
import '../styles/historial.css';

// Debe coincidir con ESTADOS_MASCOTA del backend (src/config/estadosMascota.js)
const ESTADOS_MASCOTA = ["En Refugio", "En Tratamiento", "En Cuarentena", "En Observación", "Adoptada"];
const MAX_DETALLE = 512;

const CambiarEstadoMascotaModal = ({ mascotaId, estadoActual, onClose, onSuccess }) => {
  const opciones = ESTADOS_MASCOTA.filter((estado) => estado !== estadoActual);
  const [nuevoEstado, setNuevoEstado] = useState(opciones[0]);
  const [detalle, setDetalle] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!detalle.trim()) {
      setError("Debes indicar el motivo del cambio de estado.");
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      const mascotaActualizada = await cambiarEstadoMascota(mascotaId, {
        nuevoEstado,
        detalle: detalle.trim(),
      });
      onSuccess(mascotaActualizada);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content historial-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Cambiar estado de la mascota</h2>
        <p>Estado actual: <strong>{estadoActual}</strong></p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="nuevoEstadoMascota">Nuevo estado</label>
          <select
            id="nuevoEstadoMascota"
            value={nuevoEstado}
            onChange={(e) => setNuevoEstado(e.target.value)}
          >
            {opciones.map((estado) => (
              <option key={estado} value={estado}>{estado}</option>
            ))}
          </select>

          <label htmlFor="detalleEstadoMascota">Motivo del cambio</label>
          <textarea
            id="detalleEstadoMascota"
            value={detalle}
            maxLength={MAX_DETALLE}
            onChange={(e) => setDetalle(e.target.value)}
          />
          <span className="historial-contador">{detalle.length}/{MAX_DETALLE}</span>

          {error && <p className="form-error" role="alert">{error}</p>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={enviando}>Cancelar</button>
            <button type="submit" disabled={enviando}>
              {enviando ? "Guardando..." : "Confirmar cambio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CambiarEstadoMascotaModal;