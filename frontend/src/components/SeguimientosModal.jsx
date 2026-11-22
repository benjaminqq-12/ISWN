import { useEffect, useState } from 'react';
import { getSeguimientos, registrarSeguimiento } from '../services/solicitudAdopcion.service';
import '../styles/mascotas.css';
import '../styles/solicitudes.css';

// Deben coincidir con el backend (src/config/estadosSolicitud.js)
const ESTADO_SEGUIMIENTO = "Seguimiento post-adopción";
const TIPOS_SEGUIMIENTO = ["Llamada", "Visita"];
const RESULTADOS_SEGUIMIENTO = ["Favorable", "Con observaciones", "Desfavorable", "Sin respuesta"];
const MAX_DETALLE = 512;

const CLASE_RESULTADO = {
  "Favorable": "sol-adoptada",
  "Con observaciones": "sol-pendiente",
  "Desfavorable": "sol-cancelada",
  "Sin respuesta": "sol-cancelada",
};

const formatearFecha = (fecha) =>
  fecha ? String(fecha).slice(0, 10).split('-').reverse().join('/') : '—';

const hoyLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const SeguimientosModal = ({ solicitud, onClose }) => {
  const [seguimientos, setSeguimientos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  const [registrandoId, setRegistrandoId] = useState(null);
  const [tipo, setTipo] = useState(TIPOS_SEGUIMIENTO[0]);
  const [resultado, setResultado] = useState(RESULTADOS_SEGUIMIENTO[0]);
  const [detalle, setDetalle] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorForm, setErrorForm] = useState(null);

  const puedeRegistrar = solicitud.solicitudAadopcion_estado === ESTADO_SEGUIMIENTO;
  const todosRegistrados = seguimientos.length > 0 && seguimientos.every((s) => !s.pendiente);

  useEffect(() => {
    let vigente = true;

    getSeguimientos(solicitud.solicitudAdopcion_id)
      .then((data) => {
        if (!vigente) return;
        setSeguimientos(data);
        setError(null);
      })
      .catch((err) => {
        if (vigente) setError(err.message);
      })
      .finally(() => {
        if (vigente) setLoading(false);
      });

    return () => {
      vigente = false;
    };
  }, [solicitud.solicitudAdopcion_id, version]);

  const abrirFormulario = (id) => {
    setRegistrandoId(id);
    setTipo(TIPOS_SEGUIMIENTO[0]);
    setResultado(RESULTADOS_SEGUIMIENTO[0]);
    setDetalle('');
    setErrorForm(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!detalle.trim()) {
      setErrorForm("Debes adjuntar un detalle de cómo fue el seguimiento.");
      return;
    }

    setEnviando(true);
    setErrorForm(null);

    try {
      await registrarSeguimiento(solicitud.solicitudAdopcion_id, registrandoId, {
        tipo,
        resultado,
        detalle: detalle.trim(),
      });
      setRegistrandoId(null);
      setVersion((v) => v + 1);
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setEnviando(false);
    }
  };

  const mascota = solicitud.solicitudAdopcion_mascotaAdoptada;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content sol-modal seg-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Seguimientos de la solicitud #{solicitud.solicitudAdopcion_id}</h2>
        <p>
          {mascota?.mascota_nombreCompleto} · estado actual:{" "}
          <strong>{solicitud.solicitudAadopcion_estado}</strong>
        </p>

        {loading && <p>Cargando seguimientos...</p>}
        {error && <p className="form-error" role="alert">{error}</p>}

        {!loading && !error && seguimientos.length === 0 && (
          <p>Esta solicitud no tiene seguimientos.</p>
        )}

        {!loading && !error && seguimientos.length > 0 && (
          <ul className="seg-lista">
            {seguimientos.map((s) => {
              const vencido = s.pendiente && String(s.seguimientoAdopcion_fechaLimite).slice(0, 10) < hoyLocal();

              return (
                <li key={s.seguimientoAdopcion_id} className="seg-item">
                  <div className="seg-cabecera">
                    <strong>Seguimiento a {s.seguimientoAdopcion_plazoDias} días</strong>
                    {s.pendiente ? (
                      <span className={`sol-badge ${vencido ? 'sol-cancelada' : 'sol-pendiente'}`}>
                        {vencido ? 'Vencido' : 'Pendiente'}
                      </span>
                    ) : (
                      <span className={`sol-badge ${CLASE_RESULTADO[s.seguimientoAdopcion_resultado] ?? ''}`}>
                        {s.seguimientoAdopcion_resultado}
                      </span>
                    )}
                  </div>

                  <p className="seg-meta">Fecha límite: {formatearFecha(s.seguimientoAdopcion_fechaLimite)}</p>

                  {!s.pendiente && (
                    <>
                      <p className="seg-meta">
                        {s.seguimientoAdopcion_tipo} · registrado el{" "}
                        {new Date(s.seguimientoAdopcion_fechaRegistro).toLocaleDateString('es-CL')}
                        {s.registradoPor ? ` por ${s.registradoPor.usuarioNombre} (${s.registradoPor.rol})` : ''}
                      </p>
                      <p className="seg-detalle">{s.seguimientoAdopcion_detalle}</p>
                    </>
                  )}

                  {s.pendiente && puedeRegistrar && registrandoId !== s.seguimientoAdopcion_id && (
                    <button
                      type="button"
                      className="btn-primary-sm seg-registrar"
                      onClick={() => abrirFormulario(s.seguimientoAdopcion_id)}
                    >
                      Registrar resultado
                    </button>
                  )}

                  {registrandoId === s.seguimientoAdopcion_id && (
                    <form onSubmit={handleSubmit}>
                      <label htmlFor="segTipo">Tipo de seguimiento</label>
                      <select id="segTipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                        {TIPOS_SEGUIMIENTO.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>

                      <label htmlFor="segResultado">Resultado</label>
                      <select id="segResultado" value={resultado} onChange={(e) => setResultado(e.target.value)}>
                        {RESULTADOS_SEGUIMIENTO.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>

                      <label htmlFor="segDetalle">Detalle de cómo fue el seguimiento</label>
                      <textarea
                        id="segDetalle"
                        value={detalle}
                        maxLength={MAX_DETALLE}
                        onChange={(e) => setDetalle(e.target.value)}
                      />
                      <span className="sol-contador">{detalle.length}/{MAX_DETALLE}</span>

                      {errorForm && <p className="form-error" role="alert">{errorForm}</p>}

                      <div className="modal-actions">
                        <button type="button" onClick={() => setRegistrandoId(null)} disabled={enviando}>
                          Cancelar
                        </button>
                        <button type="submit" disabled={enviando}>
                          {enviando ? "Guardando..." : "Guardar seguimiento"}
                        </button>
                      </div>
                    </form>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {puedeRegistrar && todosRegistrados && (
          <p className="seg-aviso">
            Ambos seguimientos están registrados: ya puedes marcar la solicitud como Adoptada.
          </p>
        )}

        <div className="modal-actions">
          <button type="button" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default SeguimientosModal;