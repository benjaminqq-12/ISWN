import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AvanzarEstadoModal from '../components/AvanzarEstadoModal.jsx';
import SeguimientosModal from '../components/SeguimientosModal.jsx';
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

const DIAS_POR_VENCER = 3;

const formatearFecha = (fecha) =>
  fecha ? String(fecha).slice(0, 10).split("-").reverse().join("/") : "—";

const aFecha = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const enDias = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return aFecha(d);
};

const ATENCION = {
  nueva: { clase: "sol-alerta-nueva", texto: () => "Nueva" },
  vencido: {
    clase: "sol-alerta-vencido",
    texto: (s) => `Seguimiento a ${s.proximoSeguimiento.plazoDias} días vencido`,
  },
  porVencer: {
    clase: "sol-alerta-porvencer",
    texto: (s) =>
      `Seguimiento a ${s.proximoSeguimiento.plazoDias} días vence el ${formatearFecha(s.proximoSeguimiento.fechaLimite)}`,
  },
  lista: { clase: "sol-alerta-lista", texto: () => "Lista para cerrar" },
};

const FILTROS = [
  { id: "todas", label: "Todas" },
  { id: "nueva", label: "Nuevas" },
  { id: "vencido", label: "Seguimiento vencido" },
  { id: "porVencer", label: "Seguimiento por vencer" },
  { id: "lista", label: "Listas para cerrar" },
];

// qué necesita atención en una solicitud (null = nada por ahora)
function atencionDe(s) {
  if (s.solicitudAadopcion_estado === "Pendiente") return "nueva";
  if (s.listaParaCerrar) return "lista";

  const seguimiento = s.proximoSeguimiento;
  if (seguimiento) {
    const limite = String(seguimiento.fechaLimite).slice(0, 10);
    if (limite < aFecha(new Date())) return "vencido";
    if (limite <= enDias(DIAS_POR_VENCER)) return "porVencer";
  }
  return null;
}

const Solicitudes = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seleccionada, setSeleccionada] = useState(null);
  const [verSeguimientos, setVerSeguimientos] = useState(null);
  const [filtro, setFiltro] = useState("todas");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    getSolicitudes()
      .then((data) => {
        setSolicitudes(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [version]);

  if (loading) return <p>Cargando solicitudes...</p>;
  if (error) return <p className="container" role="alert">{error}</p>;

  const conAtencion = solicitudes.map((s) => ({ s, atencion: atencionDe(s) }));

  const conteo = { todas: solicitudes.length, nueva: 0, vencido: 0, porVencer: 0, lista: 0 };
  conAtencion.forEach(({ atencion }) => {
    if (atencion) conteo[atencion] += 1;
  });
  const requierenAtencion = conteo.nueva + conteo.vencido + conteo.porVencer + conteo.lista;

  const visibles = filtro === "todas"
    ? conAtencion
    : conAtencion.filter(({ atencion }) => atencion === filtro);

  return (
    <div className="container">
      <h1>Solicitudes de adopción</h1>

      {solicitudes.length > 0 && (
        <>
          <p className="sol-resumen">
            {requierenAtencion > 0 ? (
              <>
                <strong>{requierenAtencion}</strong>{" "}
                {requierenAtencion === 1 ? "solicitud requiere" : "solicitudes requieren"} atención
              </>
            ) : (
              "Todo al día ✓"
            )}
          </p>

          <div className="sol-filtros" role="group" aria-label="Filtrar solicitudes">
            {FILTROS.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`sol-filtro ${filtro === f.id ? "activo" : ""}`}
                onClick={() => setFiltro(f.id)}
              >
                {f.label} ({conteo[f.id]})
              </button>
            ))}
          </div>
        </>
      )}

      {solicitudes.length === 0 ? (
        <p>No hay solicitudes de adopción por ahora.</p>
      ) : visibles.length === 0 ? (
        <p>No hay solicitudes en este filtro.</p>
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
              {visibles.map(({ s, atencion }) => (
                <tr key={s.solicitudAdopcion_id}>
                  <td>{s.solicitudAdopcion_id}</td>
                  <td>
                    {s.solicitudAdopcion_mascotaAdoptada ? (
                      <Link to={`/mascotas/${s.solicitudAdopcion_mascotaAdoptada.mascota_id}`}>
                        {s.solicitudAdopcion_mascotaAdoptada.mascota_nombreCompleto}
                      </Link>
                    ) : "—"}
                  </td>
                  <td>{s.solicitudAdopcion_usuarioAdoptante?.usuarioNombre ?? "—"}</td>
                  <td>{formatearFecha(s.solicitudAadopcion_fechaSolicitud)}</td>
                  <td>
                    <span className={`sol-badge ${CLASE_ESTADO[s.solicitudAadopcion_estado] ?? ""}`}>
                      {s.solicitudAadopcion_estado}
                    </span>
                    {s.solicitudAdopcion_tipoCierre && (
                      <span className="sol-tipo-cierre">{s.solicitudAdopcion_tipoCierre}</span>
                    )}
                    {atencion && (
                      <span className={`sol-alerta ${ATENCION[atencion].clase}`}>
                        {ATENCION[atencion].texto(s)}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="sol-acciones">
                      {["Seguimiento post-adopción", "Adoptada"].includes(s.solicitudAadopcion_estado) && (
                        <button className="btn-secondary-sm" onClick={() => setVerSeguimientos(s)}>
                          Seguimientos
                        </button>
                      )}
                      {s.siguientesEstados.length > 0 && (
                        <button className="btn-primary-sm" onClick={() => setSeleccionada(s)}>
                          Avanzar
                        </button>
                      )}
                    </div>
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

      {verSeguimientos && (
        <SeguimientosModal
          solicitud={verSeguimientos}
          onClose={() => {
            setVerSeguimientos(null);
            setVersion((v) => v + 1);
          }}
        />
      )}
    </div>
  );
};

export default Solicitudes;