import { useState } from 'react';
import { crearSolicitudAdopcion } from '../services/solicitudAdopcion.service';
import '../styles/mascotas.css';

const SolicitudAdopcionForm = ({ mascota, onClose, onSuccess }) => {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);

    try {
      await crearSolicitudAdopcion({ mascotaId: mascota.mascota_id });
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Solicitar adopción de {mascota.mascota_nombreCompleto}</h2>

        <form onSubmit={handleSubmit}>
          <p>
            Tu solicitud quedará registrada a nombre de tu cuenta y el equipo del
            refugio la revisará.
          </p>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={enviando}>
              Cancelar
            </button>
            <button type="submit" disabled={enviando}>
              {enviando ? "Enviando..." : "Confirmar solicitud"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SolicitudAdopcionForm;