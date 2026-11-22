
import { useEffect, useState } from "react";
import { obtenerSolicitudesPendientes, cambiarEstadoSolicitud, } from "../services/solicitudesVoluntarios.api";
import "../styles/solicitudesVoluntarios.css";

const DIAS = [
  "Lunes", "Martes", "Miércoles", "Jueves",
  "Viernes", "Sábado", "Domingo"
];

function formatearFecha(fecha) {
  if (!fecha) return "Sin fecha";

  const valor = new Date(fecha);

  return Number.isNaN(valor.getTime())
    ? "Sin fecha"
    : valor.toLocaleDateString("es-CL");
}

function formatearDisponibilidad(disponibilidad) {
  if (!disponibilidad) return ["No informada"];

  if (typeof disponibilidad === "string") {
    return [disponibilidad];
  }

  if (typeof disponibilidad !== "object") {
    return ["No informada"];
  }

  const resultado = DIAS.flatMap((dia) => {
    const horario = disponibilidad[dia];

    if (!horario) return [];

    if (typeof horario === "string") {
      return horario.trim()
        ? [`${dia}: ${horario}`]
        : [];
    }

    if (!horario.disponible) return [];

    if (Array.isArray(horario.bloques)) {
      const bloques = horario.bloques
        .map((bloque) => {
          const desde = bloque.desde || bloque.inicio;
          const hasta = bloque.hasta || bloque.fin;

          return desde && hasta
            ? `${desde} - ${hasta}`
            : "";
        })
        .filter(Boolean);

      return [`${dia}: ${bloques.join(", ") || "Disponible"}`];
    }

    return [
      `${dia}: ${horario.desde && horario.hasta
        ? `${horario.desde} - ${horario.hasta}`
        : "Disponible"
      }`
    ];
  });

  return resultado.length ? resultado : ["No informada"];
}

export default function SolicitudesVoluntarios() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [seleccionada, setSeleccionada] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState(false);

  async function cargarSolicitudes() {
    setCargando(true);
    setError("");

    try {
      const datos = await obtenerSolicitudesPendientes();
      setSolicitudes(Array.isArray(datos) ? datos : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  async function procesarSolicitud(accion) {
    if (!seleccionada || procesando) return;

    const verbo = accion === "aprobar" ? "aprobar" : "rechazar";

    const confirmado = window.confirm(
      `¿Estás seguro de ${verbo} la solicitud de ${seleccionada.nombreCompleto}?`
    );

    if (!confirmado) return;

    setProcesando(true);
    setError("");

    try {
      await cambiarEstadoSolicitud(
        seleccionada.voluntarioId,
        accion
      );

      setSeleccionada(null);

      await cargarSolicitudes();

      window.alert(
        accion === "aprobar"
          ? "Solicitud aprobada correctamente."
          : "Solicitud rechazada correctamente."
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(false);
    }
  }

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  return (
    <div className="sv-pagina">
      <div className="sv-contenedor">
        <header className="sv-encabezado">
          <div>
            <h1>Solicitudes de voluntariado</h1>
            <p>
              Revisa la información de las personas
              que desean formar parte del voluntariado.
            </p>
          </div>

          <button
            type="button"
            className="sv-boton"
            onClick={cargarSolicitudes}
            disabled={cargando}
          >
            Actualizar
          </button>
        </header>

        <div className="sv-resumen">
          <span>Solicitudes pendientes</span>
          <strong>{solicitudes.length}</strong>
        </div>

        {cargando && (
          <p className="sv-mensaje">Cargando solicitudes...</p>
        )}

        {error && (
          <p className="sv-error" role="alert">{error}</p>
        )}

        {!cargando && !error && solicitudes.length === 0 && (
          <p className="sv-mensaje">
            No existen solicitudes pendientes.
          </p>
        )}

        {!cargando && !error && solicitudes.length > 0 && (
          <div className="sv-tabla-contenedor">
            <table className="sv-tabla">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Correo electrónico</th>
                  <th>Fecha de postulación</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {solicitudes.map((solicitud) => (
                  <tr key={solicitud.voluntarioId}>
                    <td>{solicitud.nombreCompleto}</td>
                    <td>{solicitud.email}</td>
                    <td>
                      {formatearFecha(solicitud.fechaRegistro)}
                    </td>
                    <td>
                      <span className="sv-estado">
                        {solicitud.estado}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="sv-boton"
                        onClick={() => setSeleccionada(solicitud)}
                      >
                        Ver detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {seleccionada && (
          <section className="sv-detalle">
            <div className="sv-detalle-encabezado">
              <h2>Detalle de la solicitud</h2>

              <button
                type="button"
                className="sv-boton-secundario"
                onClick={() => setSeleccionada(null)}
              >
                Cerrar
              </button>
            </div>

            <div className="sv-datos">
              <p>
                <strong>Nombre completo:</strong>{" "}
                {seleccionada.nombreCompleto}
              </p>

              <p>
                <strong>RUT:</strong> {seleccionada.rut}
              </p>

              <p>
                <strong>Teléfono:</strong> {seleccionada.telefono}
              </p>

              <p>
                <strong>Correo:</strong> {seleccionada.email}
              </p>

              <p>
                <strong>Dirección:</strong> {seleccionada.direccion}
              </p>

              <p>
                <strong>Fecha de postulación:</strong>{" "}
                {formatearFecha(seleccionada.fechaRegistro)}
              </p>

              <h3>Contacto de emergencia</h3>

              <p>
                <strong>Nombre:</strong>{" "}
                {seleccionada.contactoNombre || "No informado"}
              </p>

              <p>
                <strong>Parentesco:</strong>{" "}
                {seleccionada.contactoParentesco || "No informado"}
              </p>

              <p>
                <strong>Teléfono:</strong>{" "}
                {seleccionada.contactoTelefono || "No informado"}
              </p>

              <h3>Áreas de interés</h3>

              <p>
                {Array.isArray(seleccionada.areasInteres)
                  ? seleccionada.areasInteres.join(", ")
                  : seleccionada.areasInteres || "No informadas"}
              </p>

              <h3>Disponibilidad</h3>

              <ul>
                {formatearDisponibilidad(
                  seleccionada.disponibilidad
                ).map((linea, indice) => (
                  <li key={indice}>{linea}</li>
                ))}
              </ul>

              <h3>Transporte</h3>

              <p>
                <strong>Disponible para traslados:</strong>{" "}
                {seleccionada.disponibleTraslados ? "Sí" : "No"}
              </p>

              <p>
                <strong>Posee vehículo:</strong>{" "}
                {seleccionada.poseeVehiculo ? "Sí" : "No"}
              </p>

              {seleccionada.tipoVehiculo && (
                <p>
                  <strong>Tipo de vehículo:</strong>{" "}
                  {seleccionada.tipoVehiculo}
                </p>
              )}

              {seleccionada.observaciones && (
                <>
                  <h3>Observaciones</h3>
                  <p>{seleccionada.observaciones}</p>
                </>
              )}
            </div>

            <div className="sv-acciones">
              <button
                type="button"
                className="sv-aprobar"
                onClick={() => procesarSolicitud("aprobar")}
                disabled={procesando}
              >
                {procesando ? "Procesando..." : "Aprobar solicitud"}
              </button>

              <button
                type="button"
                className="sv-rechazar"
                onClick={() => procesarSolicitud("rechazar")}
                disabled={procesando}
              >
                {procesando ? "Procesando..." : "Rechazar solicitud"}
              </button>
            </div>

          </section>
        )}
      </div>
    </div>
  );
}
