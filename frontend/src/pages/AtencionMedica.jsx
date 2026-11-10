
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";

import {
  registrarAtencionMedica,
  actualizarAtencionMedica,
  eliminarAtencionMedica,
  registrarVacuna,
  obtenerDatosPanelAtencionMedica,
} from "../services/atencionMedica.service";

import "../styles/atencionMedica.css";

const formularioInicial = {
  mascota_id: "",
  atencion_tipo: "PREVENTIVA",
  atencion_diagnostico: "",
  atencion_tratamiento: "",
  atencion_observaciones: "",
  atencion_estado_sanitario: "",
  atencion_fecha: "",
};

const formularioVacunaInicial = {
  mascota_id: "",
  vacuna_nombre: "",
  vacuna_dosis: "",
  vacuna_fechaAplicacion: "",
  vacuna_proximaDosis: "",
};

const obtenerFechaActual = () => {
  const fecha = new Date();
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
};

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

const obtenerInicial = (nombre) => {
  return nombre?.trim()?.charAt(0)?.toUpperCase() || "M";
};

export default function AtencionMedica() {
  const outletContext = useOutletContext();
  const session = outletContext?.session;

  const [formulario, setFormulario] = useState({
    ...formularioInicial,
    atencion_fecha: obtenerFechaActual(),
  });

  const [formularioVacuna, setFormularioVacuna] = useState({
    ...formularioVacunaInicial,
    vacuna_fechaAplicacion: obtenerFechaActual(),
  });

  const [mensaje, setMensaje] = useState("");
  const [mensajeTipo, setMensajeTipo] = useState("");

  const [mensajeVacuna, setMensajeVacuna] = useState("");
  const [mensajeVacunaTipo, setMensajeVacunaTipo] = useState("");

  const [guardando, setGuardando] = useState(false);
  const [guardandoVacuna, setGuardandoVacuna] = useState(false);

  const [atencionEditandoId, setAtencionEditandoId] = useState(null);
  const [eliminandoId, setEliminandoId] = useState(null);
  const [atencionPendienteEliminar, setAtencionPendienteEliminar] =
    useState(null);

  const [mascotas, setMascotas] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [tratamientosPendientes, setTratamientosPendientes] =
    useState([]);

  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [errorDatos, setErrorDatos] = useState("");

  const usuario = session?.user;

  const nombreVeterinario =
    usuario?.usuarioNombre ||
    usuario?.nombre ||
    "Veterinario";

  const fechaActual = obtenerFechaActual();

  // CARGAR DATOS DEL PANEL
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

  const mascotaSeleccionada = mascotas.find(
    (mascota) =>
      String(mascota.mascota_id) ===
      String(formulario.mascota_id)
  );

  const mascotaVacunaSeleccionada = mascotas.find(
    (mascota) =>
      String(mascota.mascota_id) ===
      String(formularioVacuna.mascota_id)
  );

  // CAMBIOS EN EL FORMULARIO DE ATENCIÓN
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormulario((actual) => ({
      ...actual,
      [name]: value,
    }));

    setMensaje("");
    setMensajeTipo("");
  };

  // CAMBIOS EN EL FORMULARIO DE VACUNACIÓN
  const handleVacunaChange = (e) => {
    const { name, value } = e.target;

    setFormularioVacuna((actual) => ({
      ...actual,
      [name]: value,
    }));

    setMensajeVacuna("");
    setMensajeVacunaTipo("");
  };

  // CANCELAR FORMULARIO DE ATENCIÓN
  const handleCancelar = () => {
    setFormulario({
      ...formularioInicial,
      atencion_fecha: obtenerFechaActual(),
    });

    setAtencionEditandoId(null);
    setMensaje("");
    setMensajeTipo("");
  };

  // CANCELAR FORMULARIO DE VACUNACIÓN
  const handleCancelarVacuna = () => {
    setFormularioVacuna({
      ...formularioVacunaInicial,
      vacuna_fechaAplicacion: obtenerFechaActual(),
    });

    setMensajeVacuna("");
    setMensajeVacunaTipo("");
  };

  // PREPARAR EDICIÓN DE ATENCIÓN
  const iniciarEdicion = (registro) => {
    if (registro.tipoRegistro === "VACUNACION") {
      return;
    }

    const atencion = registro.historialClinico_atencionMedica;
    const mascota = registro.mascota;

    if (!atencion?.atencion_id) {
      setMensaje(
        "No se pudo identificar la atención que deseas editar."
      );
      setMensajeTipo("error");
      return;
    }

    setAtencionEditandoId(atencion.atencion_id);

    setFormulario({
      mascota_id: String(mascota?.mascota_id || ""),
      atencion_tipo: atencion.atencion_tipo || "PREVENTIVA",
      atencion_diagnostico: atencion.atencion_diagnostico || "",
      atencion_tratamiento: atencion.atencion_tratamiento || "",
      atencion_observaciones: atencion.atencion_observaciones || "",
      atencion_estado_sanitario: "",
      atencion_fecha: atencion?.atencion_fecha
        ? String(atencion.atencion_fecha).slice(0, 10)
        : obtenerFechaActual(),
    });

    setMensaje(
      "Editando atención médica. Modifica los campos y guarda los cambios."
    );
    setMensajeTipo("success");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ELIMINAR ATENCIÓN
  const handleEliminar = async (atencionId) => {
    if (!atencionId) return;

    setEliminandoId(atencionId);
    setMensaje("");
    setMensajeTipo("");

    try {
      await eliminarAtencionMedica(atencionId);

      if (String(atencionEditandoId) === String(atencionId)) {
        setFormulario({
          ...formularioInicial,
          atencion_fecha: obtenerFechaActual(),
        });

        setAtencionEditandoId(null);
      }

      setAtencionPendienteEliminar(null);

      setMensaje(
        "La atención médica se eliminó correctamente."
      );
      setMensajeTipo("success");

      await cargarDatos();
    } catch (error) {
      console.error("Error eliminando atención médica:", error);

      setMensaje(
        error.response?.data?.message ||
        error.message ||
        "No se pudo eliminar la atención médica."
      );

      setMensajeTipo("error");
    } finally {
      setEliminandoId(null);
    }
  };

  // REGISTRAR O ACTUALIZAR ATENCIÓN MÉDICA
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMensaje("");
    setMensajeTipo("");

    if (!formulario.mascota_id) {
      setMensaje("Debes seleccionar una mascota.");
      setMensajeTipo("error");
      return;
    }

    if (!formulario.atencion_fecha) {
      setMensaje("Debes seleccionar la fecha de atención.");
      setMensajeTipo("error");
      return;
    }

    if (formulario.atencion_fecha > fechaActual) {
      setMensaje("La fecha de atención no puede ser futura.");
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
        atencion_estado_sanitario:
          formulario.atencion_estado_sanitario || undefined,
        atencion_fecha: formulario.atencion_fecha,
      };

      if (atencionEditandoId) {
        delete datosAtencion.mascota_id;

        await actualizarAtencionMedica(
          atencionEditandoId,
          datosAtencion
        );

        setMensaje(
          "La atención médica se actualizó correctamente."
        );
      } else {
        await registrarAtencionMedica(datosAtencion);

        setMensaje(
          "La atención médica se registró correctamente."
        );
      }

      setMensajeTipo("success");

      setFormulario({
        ...formularioInicial,
        atencion_fecha: obtenerFechaActual(),
      });

      setAtencionEditandoId(null);

      await cargarDatos();
    } catch (error) {
      console.error("Error registrando atención:", error);

      setMensaje(
        error.response?.data?.message ||
        error.message ||
        (atencionEditandoId
          ? "No se pudo actualizar la atención médica."
          : "No se pudo registrar la atención médica.")
      );

      setMensajeTipo("error");
    } finally {
      setGuardando(false);
    }
  };

  // REGISTRAR VACUNA INDEPENDIENTE
  const handleRegistrarVacuna = async (e) => {
    e.preventDefault();

    setMensajeVacuna("");
    setMensajeVacunaTipo("");

    if (!formularioVacuna.mascota_id) {
      setMensajeVacuna("Debes seleccionar una mascota.");
      setMensajeVacunaTipo("error");
      return;
    }

    if (
      !formularioVacuna.vacuna_nombre.trim() ||
      !formularioVacuna.vacuna_dosis.trim() ||
      !formularioVacuna.vacuna_fechaAplicacion
    ) {
      setMensajeVacuna(
        "Completa el nombre, la dosis y la fecha de aplicación."
      );
      setMensajeVacunaTipo("error");
      return;
    }

    if (
      formularioVacuna.vacuna_proximaDosis &&
      formularioVacuna.vacuna_proximaDosis <
        formularioVacuna.vacuna_fechaAplicacion
    ) {
      setMensajeVacuna(
        "La próxima dosis no puede tener una fecha anterior a la aplicación."
      );
      setMensajeVacunaTipo("error");
      return;
    }

    setGuardandoVacuna(true);

    try {
      const datosVacuna = {
        mascota_id: Number(formularioVacuna.mascota_id),
        vacuna_nombre: formularioVacuna.vacuna_nombre.trim(),
        vacuna_dosis: formularioVacuna.vacuna_dosis.trim(),
        vacuna_fechaAplicacion:
          formularioVacuna.vacuna_fechaAplicacion,
        vacuna_proximaDosis:
          formularioVacuna.vacuna_proximaDosis || null,
      };

      await registrarVacuna(datosVacuna);

      setMensajeVacuna(
        "La vacuna se registró correctamente y se agregó al historial clínico."
      );
      setMensajeVacunaTipo("success");

      setFormularioVacuna({
        ...formularioVacunaInicial,
        vacuna_fechaAplicacion: obtenerFechaActual(),
      });

      await cargarDatos();
    } catch (error) {
      console.error("Error registrando vacuna:", error);

      setMensajeVacuna(
        error.response?.data?.message ||
        error.message ||
        "No se pudo registrar la vacuna."
      );

      setMensajeVacunaTipo("error");
    } finally {
      setGuardandoVacuna(false);
    }
  };

  return (
    <div className="vet-page">
      <div className="vet-wrapper">

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
            <span>{atencionEditandoId ? "✓" : "＋"}</span>
            {atencionEditandoId
              ? "Guardar cambios"
              : "Registrar atención"}
          </button>
        </section>

        <div className="vet-content-grid">

          {/* FORMULARIO DE ATENCIÓN MÉDICA */}
          <section className="vet-form-card">

            <div className="vet-section-heading">
              <div>
                <h2>
                  <span>▤</span>{" "}
                  {atencionEditandoId
                    ? "Editar atención médica"
                    : "Nueva atención médica"}
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
                      {mascotaSeleccionada.mascota_sexo ||
                        "Sin sexo indicado"}
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
                      <span>*</span>
                    </label>

                    <input
                      type="date"
                      id="fecha_atencion"
                      name="atencion_fecha"
                      value={formulario.atencion_fecha}
                      max={fechaActual}
                      onChange={handleChange}
                      required
                    />

                    <small>
                      Selecciona la fecha en que se realizó la atención.
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

              {/* ESTADO SANITARIO */}
              <div className="vet-form-section">
                <h3>Estado de la mascota</h3>

                <div className="vet-field">
                  <label htmlFor="atencion_estado_sanitario">
                    Actualizar estado sanitario
                  </label>

                  <select
                    id="atencion_estado_sanitario"
                    name="atencion_estado_sanitario"
                    value={formulario.atencion_estado_sanitario}
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
                        {mascotaSeleccionada.mascota_estado ||
                          "Sin estado"}
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

              {/* EVALUACIÓN MÉDICA */}
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

              {/* MENSAJES DE ATENCIÓN */}
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

              {/* BOTONES DE ATENCIÓN */}
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
                    {atencionEditandoId
                      ? "Cancelar edición"
                      : "Cancelar"}
                  </button>

                  <button
                    type="submit"
                    className="vet-submit-button"
                    disabled={guardando || cargandoDatos}
                  >
                    {guardando
                      ? atencionEditandoId
                        ? "Actualizando..."
                        : "Guardando..."
                      : atencionEditandoId
                        ? "Guardar cambios"
                        : "Guardar atención"}
                  </button>
                </div>
              </div>
            </form>
          </section>

          {/* HISTORIAL CLÍNICO */}
          <aside className="vet-side-column">
            <section className="vet-side-card vet-history-card">

              <div className="vet-side-title">
                <span className="vet-side-icon">◷</span>
                <h3>Historial Clínico Reciente</h3>
              </div>

              {cargandoDatos ? (
                <p>Cargando historial clínico...</p>
              ) : historial.length === 0 ? (
                <div className="vet-empty-state">
                  <span>♡</span>
                  <p>
                    Todavía no hay registros clínicos.
                  </p>
                </div>
              ) : (
                <div className="vet-history-list">
                  {historial.map((registro) => {
                    const esVacunacion =
                      registro.tipoRegistro === "VACUNACION";

                    const atencion =
                      registro.historialClinico_atencionMedica;

                    const vacuna = registro.vacuna;
                    const mascota = registro.mascota;

                    const tipoAtencion =
                      atencion?.atencion_tipo === "URGENCIA"
                        ? "Urgencia"
                        : "Preventiva";

                    const claveRegistro = esVacunacion
                      ? `vacuna-${vacuna?.vacuna_id}`
                      : `historial-${registro.historialClinico_id}`;

                    return (
                      <article
                        className="vet-history-item"
                        key={claveRegistro}
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
                              {mascota?.mascota_nombreCompleto ||
                                "Mascota"}
                            </strong>

                            <span className="vet-history-badge">
                              {esVacunacion
                                ? "Vacunación"
                                : tipoAtencion}
                            </span>
                          </div>

                          {esVacunacion ? (
                            <>
                              <p>
                                <strong>Vacuna:</strong>{" "}
                                {vacuna?.vacuna_nombre ||
                                  "Sin nombre registrado"}
                              </p>

                              <p>
                                <strong>Dosis:</strong>{" "}
                                {vacuna?.vacuna_dosis ||
                                  "Sin dosis indicada"}
                              </p>

                              {vacuna?.vacuna_proximaDosis && (
                                <p>
                                  <strong>Próxima dosis:</strong>{" "}
                                  {formatearFecha(
                                    vacuna.vacuna_proximaDosis
                                  )}
                                </p>
                              )}

                              <div className="vet-history-bottom">
                                <span>Registro de vacunación</span>

                                <small>
                                  {formatearFecha(
                                    vacuna?.vacuna_fechaAplicacion
                                  )}
                                </small>
                              </div>
                            </>
                          ) : (
                            <>
                              <p>
                                {atencion?.atencion_diagnostico ||
                                  "Sin diagnóstico registrado"}
                              </p>

                              <div className="vet-history-bottom">
                                <span>{nombreVeterinario}</span>

                                <small>
                                  {formatearFecha(
                                    atencion?.atencion_fecha
                                  )}
                                </small>
                              </div>

                              <div className="vet-history-actions">
                                <button
                                  type="button"
                                  className="vet-history-edit"
                                  onClick={() =>
                                    iniciarEdicion(registro)
                                  }
                                  disabled={
                                    guardando ||
                                    Boolean(eliminandoId)
                                  }
                                >
                                  Editar
                                </button>

                                <button
                                  type="button"
                                  className="vet-history-delete"
                                  onClick={() =>
                                    setAtencionPendienteEliminar(registro)
                                  }
                                  disabled={
                                    !atencion?.atencion_id ||
                                    guardando ||
                                    Boolean(eliminandoId)
                                  }
                                >
                                  {String(eliminandoId) ===
                                  String(atencion?.atencion_id)
                                    ? "Eliminando..."
                                    : "Eliminar"}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </aside>
        </div>

        {/* FORMULARIO INDEPENDIENTE DE VACUNACIÓN */}
        <section className="vet-form-card">
          <div className="vet-section-heading">
            <div>
              <h2>
                <span>＋</span> Registrar vacunación
              </h2>

              <p>
                Registra una vacuna sin necesidad de crear una atención médica.
              </p>
            </div>
          </div>

          <form onSubmit={handleRegistrarVacuna}>
            <div className="vet-form-section">

              <div className="vet-field">
                <label htmlFor="vacuna_mascota_id">
                  Animal
                  <span>*</span>
                </label>

                <div className="vet-pet-selector">
                  {mascotaVacunaSeleccionada?.mascota_fotoURL ? (
                    <img
                      src={mascotaVacunaSeleccionada.mascota_fotoURL}
                      alt={
                        mascotaVacunaSeleccionada.mascota_nombreCompleto
                      }
                      className="vet-pet-avatar"
                    />
                  ) : (
                    <div className="vet-pet-avatar vet-pet-placeholder">
                      {obtenerInicial(
                        mascotaVacunaSeleccionada?.mascota_nombreCompleto
                      )}
                    </div>
                  )}

                  <select
                    id="vacuna_mascota_id"
                    name="mascota_id"
                    value={formularioVacuna.mascota_id}
                    onChange={handleVacunaChange}
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
              </div>

              <div className="vet-form-row">
                <div className="vet-field">
                  <label htmlFor="vacuna_nombre">
                    Nombre de la vacuna
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    id="vacuna_nombre"
                    name="vacuna_nombre"
                    value={formularioVacuna.vacuna_nombre}
                    onChange={handleVacunaChange}
                    placeholder="Ej. Vacuna antirrábica"
                    maxLength={100}
                    required
                  />
                </div>

                <div className="vet-field">
                  <label htmlFor="vacuna_dosis">
                    Dosis
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    id="vacuna_dosis"
                    name="vacuna_dosis"
                    value={formularioVacuna.vacuna_dosis}
                    onChange={handleVacunaChange}
                    placeholder="Ej. 1 dosis"
                    maxLength={100}
                    required
                  />
                </div>
              </div>

              <div className="vet-form-row">
                <div className="vet-field">
                  <label htmlFor="vacuna_fechaAplicacion">
                    Fecha de aplicación
                    <span>*</span>
                  </label>

                  <input
                    type="date"
                    id="vacuna_fechaAplicacion"
                    name="vacuna_fechaAplicacion"
                    value={formularioVacuna.vacuna_fechaAplicacion}
                    onChange={handleVacunaChange}
                    required
                  />
                </div>

                <div className="vet-field">
                  <label htmlFor="vacuna_proximaDosis">
                    Próxima dosis
                    <span className="optional-label">
                      OPCIONAL
                    </span>
                  </label>

                  <input
                    type="date"
                    id="vacuna_proximaDosis"
                    name="vacuna_proximaDosis"
                    value={formularioVacuna.vacuna_proximaDosis}
                    min={
                      formularioVacuna.vacuna_fechaAplicacion ||
                      undefined
                    }
                    onChange={handleVacunaChange}
                  />

                  <small>
                    Si corresponde, se agregará al calendario sanitario.
                  </small>
                </div>
              </div>
            </div>

            {mensajeVacuna && (
              <div
                className={`vet-message ${mensajeVacunaTipo}`}
                role="status"
                aria-live="polite"
              >
                <span>
                  {mensajeVacunaTipo === "success" ? "✓" : "!"}
                </span>
                {mensajeVacuna}
              </div>
            )}

            <div className="vet-form-footer">
              <p>
                <span>*</span> Campos obligatorios
              </p>

              <div className="vet-form-actions">
                <button
                  type="button"
                  className="vet-cancel-button"
                  onClick={handleCancelarVacuna}
                  disabled={guardandoVacuna}
                >
                  Limpiar
                </button>

                <button
                  type="submit"
                  className="vet-submit-button"
                  disabled={guardandoVacuna || cargandoDatos}
                >
                  {guardandoVacuna
                    ? "Registrando..."
                    : "Registrar vacuna"}
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* PRÓXIMOS TRATAMIENTOS */}
        <section className="vet-side-card vet-treatments-section">
          <div className="vet-side-title">
            <span className="vet-side-icon">▦</span>

            <div>
              <h3>Próximos Tratamientos Programados</h3>
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
                    <tr key={evento.calendarioSanidad_id}>
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

        {/* CONFIRMACIÓN DE ELIMINACIÓN */}
        {atencionPendienteEliminar && (
          <div
            className="vet-confirm-overlay"
            role="presentation"
            onMouseDown={(e) => {
              if (
                e.target === e.currentTarget &&
                !eliminandoId
              ) {
                setAtencionPendienteEliminar(null);
              }
            }}
          >
            <section
              className="vet-confirm-modal"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="vet-confirm-title"
              aria-describedby="vet-confirm-description"
            >
              <div className="vet-confirm-icon">!</div>

              <h2 id="vet-confirm-title">
                ¿Eliminar esta atención?
              </h2>

              <p id="vet-confirm-description">
                Vas a eliminar la atención médica de{" "}
                <strong>
                  {atencionPendienteEliminar.mascota
                    ?.mascota_nombreCompleto || "esta mascota"}
                </strong>
                . Esta acción no se puede deshacer.
              </p>

              <div className="vet-confirm-actions">
                <button
                  type="button"
                  className="vet-confirm-cancel"
                  onClick={() =>
                    setAtencionPendienteEliminar(null)
                  }
                  disabled={Boolean(eliminandoId)}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="vet-confirm-delete"
                  onClick={() =>
                    handleEliminar(
                      atencionPendienteEliminar
                        .historialClinico_atencionMedica
                        ?.atencion_id
                    )
                  }
                  disabled={Boolean(eliminandoId)}
                >
                  {eliminandoId
                    ? "Eliminando..."
                    : "Sí, eliminar"}
                </button>
              </div>
            </section>
          </div>
        )}

        <footer className="vet-footer">
          Huellas sin Hogar · Sistema de gestión veterinaria
        </footer>
      </div>
    </div>
  );
}
