import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMisSolicitudes } from '../services/solicitudAdopcion.service';

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

const MisSolicitudes = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let vigente = true;

    getMisSolicitudes()
      .then((data) => {
        if (!vigente) return;
        setSolicitudes(data);
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
  }, []);

  if (loading) return <p className="container">Cargando tus solicitudes...</p>;
  if (error) return <p className="container" role="alert">{error}</p>;

  return (
    <div className="container">
      <h1>Mis solicitudes de adopción</h1>

      {solicitudes.length === 0 ? (
        <p>
          Aún no has enviado solicitudes de adopción. Puedes elegir una mascota en{" "}
          <Link to="/mascotas">Mascotas</Link>.
        </p>
      ) : (
        <div className="tabla-scroll">
          <table className="solicitudes-tabla">
            <thead>
              <tr>
                <th>Mascota</th>
                <th>Fecha</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map((s) => {
                const mascota = s.solicitudAdopcion_mascotaAdoptada;
                return (
                  <tr key={s.solicitudAdopcion_id}>
                    <td>
                      {mascota ? (
                        <Link to={`/mascotas/${mascota.mascota_id}`}>{mascota.mascota_nombreCompleto}</Link>
                      ) : "—"}
                    </td>
                    <td>{formatearFecha(s.solicitudAadopcion_fechaSolicitud)}</td>
                    <td>
                      <span className={`sol-badge ${CLASE_ESTADO[s.solicitudAadopcion_estado] ?? ""}`}>
                        {s.solicitudAadopcion_estado}
                      </span>
                      {s.solicitudAdopcion_tipoCierre && (
                        <span className="sol-tipo-cierre">{s.solicitudAdopcion_tipoCierre}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MisSolicitudes;