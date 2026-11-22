import { useState } from 'react';
import { agregarEventoHistorial } from '../services/historialMascota.service';
import '../styles/mascotas.css';
import '../styles/historial.css';

// Debe coincidir con TIPOS_EVENTO_MANUAL del backend (src/config/estadosMascota.js)
const TIPOS_EVENTO = ["Observación", "Seguimiento post-adopción", "Atención médica", "Otro"];
const MAX_DESCRIPCION = 512;

const AgregarEventoModal = ({ mascotaId, onClose, onSuccess }) => {
  const [tipoEvento, setTipoEvento] = useState(TIPOS_EVENTO[0]);
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!descripcion.trim()) {
      setError("Debes escribir una descripción del evento.");
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      await agregarEventoHistorial(mascotaId, {
        tipoEvento,
        descripcion: descripcion.trim(),
      });
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content historial-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Agregar evento al historial</h2>

        <form onSubmit={handleSubmit}>
          <label htmlFor="tipoEvento">Tipo de evento</label>
          <select id="tipoEvento" value={tipoEvento} onChange={(e) => setTipoEvento(e.target.value)}>
            {TIPOS_EVENTO.map((tipo) => (
              <option key={tipo} value={tipo}>{tipo}</option>
            ))}
          </select>

          <label htmlFor="descripcionEvento">Descripción</label>
          <textarea
            id="descripcionEvento"
            value={descripcion}
            maxLength={MAX_DESCRIPCION}
            onChange={(e) => setDescripcion(e.target.value)}
          />
          <span className="historial-contador">{descripcion.length}/{MAX_DESCRIPCION}</span>

          {error && <p className="form-error" role="alert">{error}</p>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={enviando}>Cancelar</button>
            <button type="submit" disabled={enviando}>
              {enviando ? "Guardando..." : "Guardar evento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgregarEventoModal;