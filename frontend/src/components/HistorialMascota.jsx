import { useEffect, useState } from 'react';
import { getHistorialMascota } from '../services/historialMascota.service';
import AgregarEventoModal from './AgregarEventoModal';
import CambiarEstadoMascotaModal from './CambiarEstadoMascotaModal';
import '../styles/historial.css';

const formatearFecha = (fecha) =>
  fecha ? String(fecha).slice(0, 10).split('-').reverse().join('/') : '—';

const HistorialMascota = ({ mascotaId, estadoActual, onEstadoCambiado }) => {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarAgregar, setMostrarAgregar] = useState(false);
  const [mostrarCambioEstado, setMostrarCambioEstado] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vigente = true;

    getHistorialMascota(mascotaId)
      .then((data) => {
        if (!vigente) return;
        setEventos(data);
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
  }, [mascotaId, version]);

  return (
    <section className="historial">
      <div className="historial-header">
        <h2>Historial</h2>
        <div className="historial-acciones">
          <button
            className="btn-historial btn-historial-secundario"
            type="button"
            onClick={() => setMostrarCambioEstado(true)}
          >
            Cambiar estado
          </button>
          <button className="btn-historial" type="button" onClick={() => setMostrarAgregar(true)}>
            Agregar evento
          </button>
        </div>
      </div>

      {loading && <p>Cargando historial...</p>}
      {error && <p className="form-error" role="alert">{error}</p>}

      {!loading && !error && eventos.length === 0 && (
        <p className="historial-vacio">Esta mascota aún no tiene eventos registrados.</p>
      )}

      {!loading && !error && eventos.length > 0 && (
        <ol className="historial-lista">
          {eventos.map((evento) => (
            <li key={evento.historialMascota_id} className="historial-evento">
              <div className="historial-evento-cabecera">
                <span className="historial-evento-tipo">{evento.historialMascota_tipoEvento}</span>
                <span className="historial-evento-fecha">{formatearFecha(evento.historialMascota_fecha)}</span>
              </div>
              <p className="historial-evento-descripcion">
                {evento.historialMascota_descripcion || 'Sin descripción.'}
              </p>
              <p className="historial-evento-autor">
                {evento.registradoPor
                  ? `${evento.registradoPor.usuarioNombre} (${evento.registradoPor.rol})`
                  : 'Autor no disponible'}
              </p>
            </li>
          ))}
        </ol>
      )}

      {mostrarAgregar && (
        <AgregarEventoModal
          mascotaId={mascotaId}
          onClose={() => setMostrarAgregar(false)}
          onSuccess={() => {
            setMostrarAgregar(false);
            setVersion((v) => v + 1);
          }}
        />
      )}

      {mostrarCambioEstado && (
        <CambiarEstadoMascotaModal
          mascotaId={mascotaId}
          estadoActual={estadoActual}
          onClose={() => setMostrarCambioEstado(false)}
          onSuccess={(mascotaActualizada) => {
            setMostrarCambioEstado(false);
            setVersion((v) => v + 1);
            onEstadoCambiado?.(mascotaActualizada);
          }}
        />
      )}
    </section>
  );
};

export default HistorialMascota;