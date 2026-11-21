import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AvanzarEstadoModal from '../components/AvanzarEstadoModal.jsx';
import SeguimientosModal from '../components/SeguimientosModal.jsx';
import DatosAdoptanteModal from '../components/DatosAdoptanteModal.jsx';
import { getSolicitudes, descargarComprobante } from '../services/solicitudAdopcion.service';

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

const ESTADOS_CERRADOS = ["Adoptada", "Cancelada"];
const ESTADOS_ABIERTOS = [
  { nombre: "Pendiente", color: "#d9a514" },
  { nombre: "Reunión inicial", color: "#3978c5" },
  { nombre: "Visita/entrevista", color: "#2596be" },
  { nombre: "Seguimiento post-adopción", color: "#7856a8" },
];
const COLORES_ESTADOS = {
  Adoptada: "#2b9a62",
  Cancelada: "#d04b42",
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
  { id: "reunionInicial", label: "Reunión inicial", estado: "Reunión inicial" },
  { id: "visitaEntrevista", label: "Visita/entrevista", estado: "Visita/entrevista" },
  { id: "seguimiento", label: "Seguimiento post-adopción", estado: "Seguimiento post-adopción" },
  { id: "adoptada", label: "Adoptada", estado: "Adoptada" },
  { id: "cancelada", label: "Cancelada", estado: "Cancelada" },
];

function distribucionPorEstado(solicitudes, estadosIniciales) {
  const distribucion = estadosIniciales.map(({ nombre, color }) => ({
    nombre,
    color,
    cantidad: 0,
  }));

  solicitudes.forEach((solicitud) => {
    const nombre = solicitud.solicitudAadopcion_estado || "Sin estado";
    let estado = distribucion.find((item) => item.nombre === nombre);
    if (!estado) {
      estado = { nombre, color: "#9ca3af", cantidad: 0 };
      distribucion.push(estado);
    }
    estado.cantidad += 1;
  });

  return distribucion;
}

function GraficoPastel({ titulo, distribucion }) {
  const total = distribucion.reduce((suma, estado) => suma + estado.cantidad, 0);
  let porcentajeAcumulado = 0;
  const segmentos = distribucion
    .filter((estado) => estado.cantidad > 0)
    .map((estado) => {
      const inicio = porcentajeAcumulado;
      porcentajeAcumulado += (estado.cantidad / total) * 100;
      return `${estado.color} ${inicio}% ${porcentajeAcumulado}%`;
    });

  return (
    <article className="sol-grafico">
      <h3>{titulo}</h3>
      <div className="sol-grafico-contenido">
        <div
          className="sol-grafico-pastel"
          role="img"
          aria-label={`${titulo}. ${distribucion
            .filter((estado) => estado.cantidad > 0)
            .map((estado) => `${estado.nombre}: ${estado.cantidad}`)
            .join(", ") || "Sin solicitudes"}`}
          style={{ background: total ? `conic-gradient(${segmentos.join(", ")})` : undefined }}
        />
        <ul className="sol-grafico-leyenda">
          {distribucion.map((estado) => (
            <li key={estado.nombre}>
              <span className="sol-grafico-color" style={{ backgroundColor: estado.color }} />
              <span>{estado.nombre}</span>
              <strong>
                {estado.cantidad}
                {total > 0 && (
                  <small> ({((estado.cantidad / total) * 100).toFixed(1)}%)</small>
                )}
              </strong>
            </li>
          ))}
          <li className="sol-grafico-total">
            <span>Total</span>
            <strong>{total}</strong>
          </li>
        </ul>
      </div>
    </article>
  );
}

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
  const [descargandoId, setDescargandoId] = useState(null);
  const [errorDescarga, setErrorDescarga] = useState(null);
  const [verDatos, setVerDatos] = useState(null);
  const [filtro, setFiltro] = useState("todas");
  const [pestana, setPestana] = useState("solicitudes");
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

  const handleDescargar = async (solicitud) => {
    setDescargandoId(solicitud.solicitudAdopcion_id);
    setErrorDescarga(null);

    try {
      await descargarComprobante(solicitud.solicitudAdopcion_id);
    } catch (err) {
      setErrorDescarga(err.message);
    } finally {
      setDescargandoId(null);
    }
  };

  if (loading) return <p>Cargando solicitudes...</p>;
  if (error) return <p className="container" role="alert">{error}</p>;

  const conAtencion = solicitudes.map((s) => ({ s, atencion: atencionDe(s) }));

  const conteo = { todas: solicitudes.length, nueva: 0, vencido: 0, porVencer: 0, lista: 0 };
  conAtencion.forEach(({ atencion }) => {
    if (atencion) conteo[atencion] += 1;
  });
  FILTROS.forEach(({ id, estado }) => {
    if (estado) {
      conteo[id] = solicitudes.filter(
        (solicitud) => solicitud.solicitudAadopcion_estado === estado
      ).length;
    }
  });
  const requierenAtencion = conteo.nueva + conteo.vencido + conteo.porVencer + conteo.lista;

  const estadoFiltro = FILTROS.find(({ id }) => id === filtro)?.estado;
  const visibles = filtro === "todas"
    ? conAtencion
    : conAtencion.filter(({ s, atencion }) =>
      estadoFiltro
        ? s.solicitudAadopcion_estado === estadoFiltro
        : atencion === filtro
    );

  const cerradas = solicitudes.filter((solicitud) =>
    ESTADOS_CERRADOS.includes(solicitud.solicitudAadopcion_estado)
  );
  const noCerradas = solicitudes.filter((solicitud) =>
    !ESTADOS_CERRADOS.includes(solicitud.solicitudAadopcion_estado)
  );
  const distribucionCerradas = distribucionPorEstado(cerradas, [
    { nombre: "Adoptada", color: COLORES_ESTADOS.Adoptada },
    { nombre: "Cancelada", color: COLORES_ESTADOS.Cancelada },
  ]);
  const distribucionNoCerradas = distribucionPorEstado(noCerradas, ESTADOS_ABIERTOS);

  return (
    <div className="container">
      <h1>Solicitudes de adopción</h1>
      {errorDescarga && <p className="form-error" role="alert">{errorDescarga}</p>}
      <div className="sol-pestanas" role="group" aria-label="Secciones de solicitudes">
        <button
          type="button"
          className={`sol-pestana ${pestana === "solicitudes" ? "activa" : ""}`}
          aria-pressed={pestana === "solicitudes"}
          onClick={() => setPestana("solicitudes")}
        >
          Solicitudes
        </button>
        <button
          type="button"
          className={`sol-pestana ${pestana === "estadisticas" ? "activa" : ""}`}
          aria-pressed={pestana === "estadisticas"}
          onClick={() => setPestana("estadisticas")}
        >
          Estadísticas
        </button>
      </div>

      {pestana === "solicitudes" ? (
        <>
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
                      
                      <td>
                        {s.solicitudAdopcion_mascotaAdoptada ? (
                          <Link to={`/mascotas/${s.solicitudAdopcion_mascotaAdoptada.mascota_id}`}>
                            {s.solicitudAdopcion_mascotaAdoptada.mascota_nombreCompleto}
                          </Link>
                        ) : "—"}
                      </td>
                      <td>
                        <button type="button" className="sol-link" onClick={() => setVerDatos(s)}>
                          {s.solicitudAdopcion_usuarioAdoptante?.usuarioNombre ?? "—"}
                        </button>
                        {s.solicitudAdopcion_telefono && (
                          <span className="sol-contacto">{s.solicitudAdopcion_telefono}</span>
                        )}
                      </td>
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
                          {s.solicitudAadopcion_estado === "Adoptada" && (
                            <button
                              className="btn-secondary-sm"
                              onClick={() => handleDescargar(s)}
                              disabled={descargandoId === s.solicitudAdopcion_id}
                            >
                              {descargandoId === s.solicitudAdopcion_id ? "Generando..." : "Informe PDF"}
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
        </>
      ) : (
        <section className="sol-estadisticas" aria-label="Estadísticas de solicitudes">
          <GraficoPastel
            titulo="Solicitudes cerradas"
            distribucion={distribucionCerradas}
          />
          <GraficoPastel
            titulo="Solicitudes no cerradas"
            distribucion={distribucionNoCerradas}
          />
        </section>
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
      {verDatos && (
        <DatosAdoptanteModal solicitud={verDatos} onClose={() => setVerDatos(null)} />
      )}

    </div>
  );
};

export default Solicitudes;