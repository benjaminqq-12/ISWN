
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";

import {
  registrarAtencionMedica,
  obtenerDatosPanelAtencionMedica,
} from "../services/atencionMedica.service";

import "../styles/atencionMedica.css";

const formularioInicial = {
  mascota_id: "",
  atencion_tipo: "PREVENTIVA",
  atencion_diagnostico: "",
  atencion_tratamiento: "",
  atencion_observaciones: "",
  mascota_estado: "",
};

// Obtener la fecha actual para el formulario.
const obtenerFechaActual = () => {
  const fecha = new Date();
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
};

// Formatear fechas para mostrarlas en pantalla.
const formatearFecha = (fecha) => {
  if (!fecha) return "Sin fecha";

  let fechaValida;

  if (/^\d{4}-\d{2}-\d{2}$/.test(String(fecha))) {
    const [anio, mes, dia] = fecha.split("-").map(Number);
    fechaValida = new Date(anio, mes - 1, dia);
  } else {
    fechaValida = new Date(fecha);
  }

  if (Number.isNaN(fechaValida.getTime())) {
    return "Sin fecha";
  }

  return fechaValida.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Obtener la primera letra del nombre de una mascota.
const obtenerInicial = (nombre) => {
  return nombre?.trim()?.charAt(0)?.toUpperCase() || "M";
};

export default function AtencionMedica() {
  const { session } = useOutletContext();

  // =========================================
  // ESTADOS DEL FORMULARIO
  // =========================================

  const [formulario, setFormulario] = useState(formularioInicial);

  const [mensaje, setMensaje] = useState("");
  const [mensajeTipo, setMensajeTipo] = useState("");

  const [guardando, setGuardando] = useState(false);

  // =========================================
  // ESTADOS DE LOS DATOS DEL PANEL
  // =========================================

  const [mascotas, setMascotas] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [tratamientosPendientes, setTratamientosPendientes] =
    useState([]);

  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [errorDatos, setErrorDatos] = useState("");

  // =========================================
  // INFORMACIÓN DEL USUARIO
  // =========================================

  const usuario = session?.user;

  const nombreVeterinario =
    usuario?.usuarioNombre ||
    usuario?.nombre ||
    "Veterinario";

  const fechaActual = obtenerFechaActual();

  // =========================================
  // CARGAR DATOS DEL PANEL
  // =========================================

  const cargarDatos = async () => {
    setCargandoDatos(true);
    setErrorDatos("");

    try {
      const datos = await obtenerDatosPanelAtencionMedica();

      setMascotas(datos.mascotas || []);
      setHistorial(datos.historial || []);
      setTratamientosPendientes(
        datos.tratamientosPendientes || []
      );

      setErrorDatos(datos.errorDatos || "");
    } catch (error) {
      console.error("Error cargando panel médico:", error);

      setErrorDatos(
        error.message ||
        "No se pudieron cargar los datos médicos."
      );
    } finally {
      setCargandoDatos(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // =========================================
  // MASCOTA SELECCIONADA
  // =========================================

  const mascotaSeleccionada = mascotas.find(
    (mascota) =>
      String(mascota.mascota_id) ===
      String(formulario.mascota_id)
  );

  // =========================================
  // CAMBIOS EN EL FORMULARIO
  // =========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }));

    setMensaje("");
    setMensajeTipo("");
  };

  // =========================================
  // CANCELAR FORMULARIO
  // =========================================

  const handleCancelar = () => {
    setFormulario(formularioInicial);
    setMensaje("");
    setMensajeTipo("");
  };

  // =========================================
  // REGISTRAR ATENCIÓN MÉDICA
  // =========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMensaje("");
    setMensajeTipo("");

    if (!formulario.mascota_id) {
      setMensaje("Debes seleccionar una mascota.");
      setMensajeTipo("error");
      return;
    }

    if (
      !formulario.atencion_diagnostico.trim() ||
      !formulario.atencion_tratamiento.trim()
    ) {
      setMensaje(
        "El diagnóstico y el tratamiento son obligatorios."
      );

      setMensajeTipo("error");
      return;
    }

    setGuardando(true);

    try {
      const datosAtencion = {
        mascota_id: Number(formulario.mascota_id),

        atencion_tipo: formulario.atencion_tipo,

        atencion_diagnostico:
          formulario.atencion_diagnostico.trim(),

        atencion_tratamiento:
          formulario.atencion_tratamiento.trim(),

        atencion_observaciones:
          formulario.atencion_observaciones.trim(),

        // Se envía vacío si queremos mantener el estado actual.
        mascota_estado: formulario.mascota_estado || undefined,
      };

      await registrarAtencionMedica(datosAtencion);

      setMensaje(
        "La atención médica se registró correctamente."
      );

      setMensajeTipo("success");

      setFormulario(formularioInicial);

      // Actualizar historial clínico y calendario sanitario.
      await cargarDatos();

    } catch (error) {
      console.error("Error registrando atención:", error);

      setMensaje(
        error.message ||
        "No se pudo registrar la atención médica."
      );

      setMensajeTipo("error");

    } finally {
      setGuardando(false);
    }
  };

  // =========================================
  // REPRESENTACIÓN VISUAL
  // =========================================

  return (
    <div className="vet-page">

      <div className="vet-wrapper">

        {/* =================================
            ENCABEZADO
        ================================== */}

        <div className="vet-breadcrumb">
          <span>Huellitas</span>
          <span>/</span>
          <strong>Atención veterinaria</strong>
        </div>

        <section className="vet-header">

          <div>
            <h1>Atención veterinaria</h1>
          </div>

          <button
            type="submit"
            form="form-atencion-medica"
            className="vet-submit-button"
            disabled={guardando || cargandoDatos}
          >
            <span>＋</span>
            Registrar atención
          </button>

        </section>

        {/* =================================
            CONTENIDO PRINCIPAL
        ================================== */}

        <div className="vet-content-grid">

          {/* =================================
              FORMULARIO DE ATENCIÓN
          ================================== */}

          <section className="vet-form-card">

            <div className="vet-section-heading">

              <div>
                <h2>
                  <span>▤</span> Nueva atención médica
                </h2>
              </div>

            </div>

            <form
              id="form-atencion-medica"
              onSubmit={handleSubmit}
            >

              {/* SELECCIÓN DE MASCOTA */}

              <div className="vet-form-section">

                <div className="vet-field">

                  <label htmlFor="mascota_id">
                    Animal
                    <span>*</span>
                  </label>

                  <div className="vet-pet-selector">

                    {mascotaSeleccionada?.mascota_fotoURL ? (
                      <img
                        src={mascotaSeleccionada.mascota_fotoURL}
                        alt={mascotaSeleccionada.mascota_nombreCompleto}
                        className="vet-pet-avatar"
                      />
                    ) : (
                      <div className="vet-pet-avatar vet-pet-placeholder">
                        {obtenerInicial(
                          mascotaSeleccionada?.mascota_nombreCompleto
                        )}
                      </div>
                    )}

                    <select
                      id="mascota_id"
                      name="mascota_id"
                      value={formulario.mascota_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">
                        {cargandoDatos
                          ? "Cargando mascotas..."
                          : "Selecciona una mascota"}
                      </option>

                      {mascotas.map((mascota) => (
                        <option
                          key={mascota.mascota_id}
                          value={mascota.mascota_id}
                        >
                          {mascota.mascota_nombreCompleto}
                          {" ("}
                          {mascota.mascota_especie}
                          {")"}
                        </option>
                      ))}

                    </select>

                  </div>

                  {mascotaSeleccionada && (
                    <small>
                      ID: {mascotaSeleccionada.mascota_id}
                      {" · "}
                      {mascotaSeleccionada.mascota_sexo || "Sin sexo indicado"}
                    </small>
                  )}

                </div>

                {/* TIPO DE ATENCIÓN */}

                <div className="vet-field">

                  <label htmlFor="atencion_tipo">
                    Tipo de atención
                    <span>*</span>
                  </label>

                  <div className="vet-type-selector">

                    <label
                      className={
                        formulario.atencion_tipo === "PREVENTIVA"
                          ? "vet-type-option selected"
                          : "vet-type-option"
                      }
                    >
                      <input
                        type="radio"
                        name="atencion_tipo"
                        value="PREVENTIVA"
                        checked={
                          formulario.atencion_tipo === "PREVENTIVA"
                        }
                        onChange={handleChange}
                      />

                      <span className="vet-radio-circle"></span>

                      Preventiva
                    </label>

                    <label
                      className={
                        formulario.atencion_tipo === "URGENCIA"
                          ? "vet-type-option selected"
                          : "vet-type-option"
                      }
                    >
                      <input
                        type="radio"
                        name="atencion_tipo"
                        value="URGENCIA"
                        checked={
                          formulario.atencion_tipo === "URGENCIA"
                        }
                        onChange={handleChange}
                      />

                      <span className="vet-radio-circle"></span>

                      Urgencia
                    </label>

                  </div>

                </div>

                {/* FECHA Y VETERINARIO */}

                <div className="vet-form-row">

                  <div className="vet-field">

                    <label htmlFor="fecha_atencion">
                      Fecha de atención
                    </label>

                    <input
                      type="date"
                      id="fecha_atencion"
                      value={fechaActual}
                      readOnly
                    />

                    <small>
                      La fecha definitiva se genera al registrar.
                    </small>

                  </div>

                  <div className="vet-field">

                    <label htmlFor="veterinario">
                      Veterinario
                    </label>

                    <input
                      type="text"
                      id="veterinario"
                      value={nombreVeterinario}
                      readOnly
                    />

                    <small>
                      Usuario de la sesión actual.
                    </small>

                  </div>

                </div>

              </div>

              {/* =================================
                  ESTADO SANITARIO DE LA MASCOTA
              ================================== */}

              <div className="vet-form-section">

                <h3>Estado de la mascota</h3>

                <div className="vet-field">

                  <label htmlFor="mascota_estado">
                    Actualizar estado sanitario
                  </label>

                  <select
                    id="mascota_estado"
                    name="mascota_estado"
                    value={formulario.mascota_estado}
                    onChange={handleChange}
                    disabled={!mascotaSeleccionada}
                  >
                    <option value="">
                      Mantener estado actual
                    </option>

                    <option value="En Tratamiento">
                      En Tratamiento
                    </option>

                    <option value="En Observación">
                      En Observación
                    </option>

                    <option value="En Cuarentena">
                      En Cuarentena
                    </option>

                    <option value="En Refugio">
                      En Refugio
                    </option>

                    <option value="En adopción">
                      En adopción
                    </option>

                  </select>

                  {mascotaSeleccionada && (
                    <small>
                      Estado actual:{" "}
                      <strong>
                        {mascotaSeleccionada.mascota_estado || "Sin estado"}
                      </strong>
                    </small>
                  )}

                  <small>
                    Si mantienes la opción inicial, el estado de la mascota
                    no cambiará. Las mascotas en Cuarentena u Observación
                    dejarán de aparecer en el listado público de adopción.
                  </small>

                </div>

              </div>

              {/* =================================
                  EVALUACIÓN MÉDICA
              ================================== */}

              <div className="vet-form-section">

                <h3>Diagnóstico</h3>

                <div className="vet-field">

                  <textarea
                    id="atencion_diagnostico"
                    name="atencion_diagnostico"
                    value={formulario.atencion_diagnostico}
                    onChange={handleChange}
                    placeholder="Describe el diagnóstico de la mascota..."
                    rows="4"
                    required
                  />

                </div>

                <div className="vet-field">

                  <label htmlFor="atencion_tratamiento">
                    Medicamentos / tratamiento indicado
                    <span>*</span>
                  </label>

                  <textarea
                    id="atencion_tratamiento"
                    name="atencion_tratamiento"
                    value={formulario.atencion_tratamiento}
                    onChange={handleChange}
                    placeholder="Describe los medicamentos o el tratamiento indicado..."
                    rows="3"
                    required
                  />

                </div>

                <div className="vet-field">

                  <label htmlFor="atencion_observaciones">
                    Observaciones adicionales
                    <span className="optional-label">
                      OPCIONAL
                    </span>
                  </label>

                  <textarea
                    id="atencion_observaciones"
                    name="atencion_observaciones"
                    value={formulario.atencion_observaciones}
                    onChange={handleChange}
                    placeholder="Agrega información complementaria..."
                    rows="3"
                  />

                </div>

              </div>

              {/* =================================
                  MENSAJES
              ================================== */}

              {mensaje && (
                <div
                  className={`vet-message ${mensajeTipo}`}
                  role="status"
                  aria-live="polite"
                >
                  <span>
                    {mensajeTipo === "success" ? "✓" : "!"}
                  </span>

                  {mensaje}
                </div>
              )}

              {errorDatos && (
                <div
                  className="vet-message error"
                  role="alert"
                >
                  <span>!</span>
                  {errorDatos}
                </div>
              )}

              {/* =================================
                  BOTONES
              ================================== */}

              <div className="vet-form-footer">

                <p>
                  <span>*</span> Campos obligatorios
                </p>

                <div className="vet-form-actions">

                  <button
                    type="button"
                    className="vet-cancel-button"
                    onClick={handleCancelar}
                    disabled={guardando}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="vet-submit-button"
                    disabled={guardando || cargandoDatos}
                  >
                    {guardando
                      ? "Guardando..."
                      : "Guardar atención"}
                  </button>

                </div>

              </div>

            </form>

          </section>

          {/* =================================
              HISTORIAL RECIENTE
          ================================== */}

          <aside className="vet-side-column">

            <section className="vet-side-card vet-history-card">

              <div className="vet-side-title">

                <span className="vet-side-icon">
                  ◷
                </span>

                <h3>
                  Historial Reciente de Atenciones
                </h3>

              </div>

              {cargandoDatos ? (

                <p>Cargando historial clínico...</p>

              ) : historial.length === 0 ? (

                <div className="vet-empty-state">
                  <span>♡</span>

                  <p>
                    Todavía no hay atenciones médicas registradas.
                  </p>
                </div>

              ) : (

                <div className="vet-history-list">

                  {historial.slice(0, 5).map((registro) => {

                    const atencion =
                      registro.historialClinico_atencionMedica;

                    const mascota = registro.mascota;

                    const tipo =
                      atencion?.atencion_tipo === "URGENCIA"
                        ? "Urgencia"
                        : "Preventiva";

                    return (
                      <article
                        className="vet-history-item"
                        key={registro.historialClinico_id}
                      >

                        <div className="vet-history-photo">

                          {mascota?.mascota_fotoURL ? (
                            <img
                              src={mascota.mascota_fotoURL}
                              alt={mascota.mascota_nombreCompleto}
                            />
                          ) : (
                            <span>
                              {obtenerInicial(
                                mascota?.mascota_nombreCompleto
                              )}
                            </span>
                          )}

                        </div>

                        <div className="vet-history-content">

                          <div className="vet-history-top">

                            <strong>
                              {mascota?.mascota_nombreCompleto || "Mascota"}
                            </strong>

                            <span className="vet-history-badge">
                              {tipo}
                            </span>

                          </div>

                          <p>
                            {atencion?.atencion_diagnostico ||
                              "Sin diagnóstico registrado"}
                          </p>

                          <div className="vet-history-bottom">

                            <span>
                              {nombreVeterinario}
                            </span>

                            <small>
                              {formatearFecha(
                                atencion?.atencion_fecha
                              )}
                            </small>

                          </div>

                        </div>

                      </article>
                    );
                  })}

                </div>

              )}

            </section>

          </aside>

        </div>

        {/* =================================
            PRÓXIMOS TRATAMIENTOS
        ================================== */}

        <section className="vet-side-card vet-treatments-section">

          <div className="vet-side-title">

            <span className="vet-side-icon">
              ▦
            </span>

            <div>
              <h3>
                Próximos Tratamientos Programados
              </h3>

              <p>
                Seguimiento de vacunas y controles pendientes.
              </p>
            </div>

          </div>

          {cargandoDatos ? (

            <p>Cargando tratamientos programados...</p>

          ) : tratamientosPendientes.length === 0 ? (

            <div className="vet-empty-state">
              <span>✓</span>

              <p>
                No hay tratamientos pendientes registrados.
              </p>
            </div>

          ) : (

            <div className="vet-treatment-table-wrapper">

              <table className="vet-treatment-table">

                <thead>
                  <tr>
                    <th>Paciente</th>
                    <th>Tratamiento / Dosis</th>
                    <th>Fecha programada</th>
                    <th>Estado</th>
                  </tr>
                </thead>

                <tbody>

                  {tratamientosPendientes.map((evento) => (

                    <tr
                      key={evento.calendarioSanidad_id}
                    >

                      <td>

                        <strong>
                          {evento.mascota?.mascota_nombreCompleto ||
                            "Mascota"}
                        </strong>

                        <small>
                          {evento.mascota?.mascota_especie || ""}
                        </small>

                      </td>

                      <td>

                        <strong>
                          {evento.calendarioSanidad_tipo}
                        </strong>

                        <p>
                          {evento.calendarioSanidad_descripcion}
                        </p>

                      </td>

                      <td className="vet-treatment-date">
                        {formatearFecha(
                          evento.calendarioSanidad_fecha
                        )}
                      </td>

                      <td>
                        <span className="vet-treatment-status">
                          Pendiente
                        </span>
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </section>

        {/* =================================
            PIE DE PÁGINA
        ================================== */}

        <footer className="vet-footer">
          Huellas sin Hogar · Sistema de gestión veterinaria
        </footer>

      </div>

    </div>
  );
}
