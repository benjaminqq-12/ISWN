import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getUsuarios } from '../services/usuario.service';
import { crearSolicitudAdopcion } from '../services/solicitudAdopcion.service';
import '../styles/mascotas.css';

const SolicitudAdopcionForm = ({ mascota, onClose, onSuccess }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioAdoptanteId, setUsuarioAdoptanteId] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getUsuarios()
      .then(setUsuarios)
      .catch(() => setError("No se pudieron cargar los usuarios."));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usuarioAdoptanteId) {
      setError("Selecciona un usuario adoptante.");
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      await crearSolicitudAdopcion({
        mascotaId: mascota.mascota_id,
        usuarioAdoptanteId: Number(usuarioAdoptanteId),
      });
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
        <h2>Solicitar adopción de {mascota.mascota_nombreCompleto}</h2>

        <form onSubmit={handleSubmit}>
          <label htmlFor="usuarioAdoptante">Usuario adoptante (temporal, mientras no hay login)</label>
          <select
            id="usuarioAdoptante"
            value={usuarioAdoptanteId}
            onChange={(event) => setUsuarioAdoptanteId(event.target.value)}
          >
            <option value="">-- Selecciona un usuario --</option>
            {usuarios.map((usuario) => (
              <option key={usuario.usuarioId} value={usuario.usuarioId}>
                {usuario.usuarioNombre} ({usuario.usuarioEmail})
              </option>
            ))}
          </select>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={enviando}>
              Cancelar
            </button>
            <button type="submit" disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar solicitud"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default SolicitudAdopcionForm;