import { useEffect, useState } from 'react';
import AvanzarEstadoModal from '../components/AvanzarEstadoModal.jsx';
import { getSolicitudes } from '../services/solicitudAdopcion.service';

import '../styles/home.css';
import '../styles/solicitudes.css';

const CLASE_ESTADO = {
  "Pendiente": "sol-pendiente",
  "Reunión inicial": "sol-en-curso",
  "Visita/entrevista": "sol-en-curso",
  "Seguimiento post-adopción": "sol-en-curso",
  "Adoptada": "sol-adoptada",
  "Cancelada": "sol-cancelada",
};

const formatearFecha = (fecha) =>
  fecha ? String(fecha).slice(0, 10).split("-").reverse().join("/") : "—";

const Solicitudes = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seleccionada, setSeleccionada] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    getSolicitudes()
      .then((data) => {
        setSolicitudes(data);
        setError(null);
      })
      .catch(() => setError("No se pudieron cargar las solicitudes."))
      .finally(() => setLoading(false));
  }, [version]);

  if (loading) return <p>Cargando solicitudes...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="container">
      <h1>Solicitudes de adopción</h1>

      {solicitudes.length === 0 ? (
        <p>No hay solicitudes de adopción por ahora.</p>
      ) : (
        <div className="tabla-scroll">
          <table className="solicitudes-tabla">
            <thead>
              <tr>
                <th>#</th>
                <th>Mascota</th>
                <th>Adoptante</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((s) => (
                <tr key={s.solicitudAdopcion_id}>
                  <td>{s.solicitudAdopcion_id}</td>
                  <td>{s.solicitudAdopcion_mascotaAdoptada?.mascota_nombreCompleto ?? "—"}</td>
                  <td>{s.solicitudAdopcion_usuarioAdoptante?.usuarioNombre ?? "—"}</td>
                  <td>{formatearFecha(s.solicitudAadopcion_fechaSolicitud)}</td>
                  <td>
                    <span className={`sol-badge ${CLASE_ESTADO[s.solicitudAadopcion_estado] ?? ""}`}>
                      {s.solicitudAadopcion_estado}
                    </span>
                  </td>
                  <td>
                    {s.siguientesEstados.length > 0 && (
                      <button className="btn-primary-sm" onClick={() => setSeleccionada(s)}>
                        Avanzar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {seleccionada && (
        <AvanzarEstadoModal
          solicitud={seleccionada}
          onClose={() => setSeleccionada(null)}
          onSuccess={() => {
            setSeleccionada(null);
            setVersion((v) => v + 1);
          }}
        />
      )}
    </div>
  );
};

export default Solicitudes;