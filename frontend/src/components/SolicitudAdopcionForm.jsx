import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useOutletContext } from 'react-router-dom';
import { crearSolicitudAdopcion, puedeSolicitarAdopcion } from '../services/solicitudAdopcion.service';
import '../styles/mascotas.css';

const MAX_TEXTO = 512;

const SolicitudAdopcionForm = ({ mascota, onClose, onSuccess }) => {
  const { session } = useOutletContext() ?? {};

  const [verificando, setVerificando] = useState(true);
  const [bloqueo, setBloqueo] = useState(null);

  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState(session?.user?.usuarioEmail ?? '');
  const [direccion, setDireccion] = useState('');
  const [mascotasActuales, setMascotasActuales] = useState('');
  const [motivoAdopcion, setMotivoAdopcion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  // al abrirse, se avisa de inmediato si el usuario ya tiene una solicitud inconclusa
  useEffect(() => {
    let vigente = true;

    puedeSolicitarAdopcion()
      .then((resultado) => {
        if (vigente && !resultado?.puedeSolicitar) {
          setBloqueo(resultado?.motivo ?? "No puedes enviar una solicitud en este momento.");
        }
      })
      // si la verificación falla se muestra el formulario: el backend vuelve a validar al enviar
      .catch(() => {})
      .finally(() => {
        if (vigente) setVerificando(false);
      });

    return () => {
      vigente = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);

    try {
      await crearSolicitudAdopcion({
        mascotaId: mascota.mascota_id,
        telefono: telefono.trim(),
        correo: correo.trim(),
        direccion: direccion.trim(),
        mascotasActuales: mascotasActuales.trim(),
        motivoAdopcion: motivoAdopcion.trim(),
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
      <div className="modal-content adopcion-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Solicitar adopción de {mascota.mascota_nombreCompleto}</h2>

        {verificando && <p className="adopcion-ayuda">Verificando...</p>}

        {!verificando && bloqueo && (
          <>
            <p>{bloqueo}</p>
            <div className="modal-actions">
              <button type="button" onClick={onClose}>Cerrar</button>
              <Link className="adopcion-link-primario" to="/mis-solicitudes" onClick={onClose}>
                Ver mis solicitudes
              </Link>
            </div>
          </>
        )}

        {!verificando && !bloqueo && (
          <>
            <p className="adopcion-ayuda">
              El refugio usará estos datos para contactarte y coordinar las reuniones.
            </p>

            <form onSubmit={handleSubmit}>
              <label htmlFor="adopTelefono">Teléfono de contacto</label>
              <input
                id="adopTelefono"
                type="tel"
                placeholder="+56 9 1234 5678"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                required
              />

              <label htmlFor="adopCorreo">Correo electrónico</label>
              <input
                id="adopCorreo"
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                required
              />

              <label htmlFor="adopDireccion">Dirección de tu vivienda</label>
              <input
                id="adopDireccion"
                type="text"
                maxLength={200}
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                required
              />

              <label htmlFor="adopMascotas">Mascotas que tienes actualmente</label>
              <textarea
                id="adopMascotas"
                maxLength={MAX_TEXTO}
                value={mascotasActuales}
                onChange={(e) => setMascotasActuales(e.target.value)}
                required
              />
              <span className="adopcion-ayuda">Si no tienes mascotas, escribe "Ninguna".</span>

              <label htmlFor="adopMotivo">¿Por qué quieres adoptar?</label>
              <textarea
                id="adopMotivo"
                maxLength={MAX_TEXTO}
                value={motivoAdopcion}
                onChange={(e) => setMotivoAdopcion(e.target.value)}
                required
              />

              {error && <p className="form-error" role="alert">{error}</p>}

              <div className="modal-actions">
                <button type="button" onClick={onClose} disabled={enviando}>
                  Cancelar
                </button>
                <button type="submit" disabled={enviando}>
                  {enviando ? "Enviando..." : "Enviar solicitud"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};

export default SolicitudAdopcionForm;