import { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import MascotaCard from '../components/MascotaCard.jsx';
import {
  actualizarMascota,
  crearMascota,
  eliminarMascota,
  getMascotaInterna,
  getMascotas,
  getMascotasInternas,
  revisarMascotasLote,  
  eliminarMascotasLote,
} from '../services/mascota.service';
import '../styles/home.css';
import '../styles/mascotas.css';

const NuestrasMascotas = () => {
  const { session } = useOutletContext();
  const [mascotas, setMascotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [mascotaEnEdicion, setMascotaEnEdicion] = useState(null);
  const [mascotaOcupadaId, setMascotaOcupadaId] = useState(null);
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [eliminandoVarias, setEliminandoVarias] = useState(false);

  const formRef = useRef(null);
  const puedeGestionar = session?.user?.activo === true &&
    ["Admin", "Voluntario", "Veterinario"].includes(
      session?.user?.rol
    );
  const mascotasVisibles = puedeGestionar
    ? mascotas
    : mascotas.filter(
        (mascota) => mascota.mascota_estado === "En Refugio"
      );

  function cambiarModoSeleccion() {
    if (!puedeGestionar || eliminandoVarias) return;

    if (modoSeleccion) {
      setModoSeleccion(false);
      setSeleccionadas([]);
      return;
    }

    // Cerrar el formulario de registro o edición.
    setFormVisible(false);
    setMascotaEnEdicion(null);
    setFormError("");
    setSuccessMessage("");

    setActionError("");
    setActionMessage("");
    setSeleccionadas([]);
    setModoSeleccion(true);
  }

  function alternarSeleccion(mascotaId) {
    if (!puedeGestionar || eliminandoVarias) return;

    setSeleccionadas((actuales) =>
      actuales.includes(mascotaId)
        ? actuales.filter((id) => id !== mascotaId)
        : [...actuales, mascotaId]
    );
  }

  function seleccionarTodas(marcar) {
    if (!puedeGestionar || eliminandoVarias) return;

    setSeleccionadas(
      marcar
        ? mascotasVisibles.map((mascota) => mascota.mascota_id)
        : []
    );
  }

  useEffect(() => {
    let vigente = true;

    setLoading(true);
    setError(null);
    setMascotas([]);

    const peticion = puedeGestionar
      ? getMascotasInternas()
      : getMascotas();

    peticion
      .then((datos) => {
        if (vigente) {
          setMascotas(datos);
        }
      })
      .catch((error) => {
        console.error("Error al cargar mascotas:", error);

        if (vigente) {
          setError(
            error.cause?.response?.data?.message ||
            error.message ||
            "No se pudieron cargar las mascotas."
          );
        }
      })
      .finally(() => {
        if (vigente) {
          setLoading(false);
        }
      });
    return () => {
      vigente = false;
    };
  }, [puedeGestionar, session?.token]);

  useEffect(() => {
    setModoSeleccion(false);
    setSeleccionadas([]);
  }, [session?.token, puedeGestionar]);

  useEffect(() => {
    if (formVisible) formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [formVisible, mascotaEnEdicion]);

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");
    setSaving(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const mascota = {
      mascota_nombreCompleto: formData.get("mascota_nombreCompleto"),
      mascota_especie: formData.get("mascota_especie"),
      mascota_edad: Number(formData.get("mascota_edad")),
      mascota_peso: Number(formData.get("mascota_peso")),
      mascota_sexo: formData.get("mascota_sexo"),
      mascota_viaIngreso: formData.get("mascota_viaIngreso"),
      mascota_estado: formData.get("mascota_estado"),
      mascota_antecedentesPrevios: formData.get("mascota_antecedentesPrevios"),
      mascota_fotoURL: formData.get("mascota_fotoURL"),
    };

    try {
      if (mascotaEnEdicion) {
        const mascotaActualizada = await actualizarMascota(
          mascotaEnEdicion.mascota_id,
          mascota,
          session.token
        );
        setMascotas((actuales) => actuales.map((actual) => (
          actual.mascota_id === mascotaActualizada.mascota_id ? mascotaActualizada : actual
        )));
        setSuccessMessage("Los datos de la mascota se actualizaron correctamente.");
      } else {
        const mascotaCreada = await crearMascota(mascota, session.token);
        setMascotas((actuales) => [mascotaCreada, ...actuales]);
        setSuccessMessage("La mascota se registró correctamente.");
      }
      form.reset();
      setFormVisible(false);
      setMascotaEnEdicion(null);
    } catch (submitError) {
      setFormError(submitError.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleEditar(mascota) {
    setActionError("");
    setActionMessage("");
    setFormError("");
    setSuccessMessage("");
    setFormVisible(false);
    setMascotaOcupadaId(mascota.mascota_id);
    try {
      const datosInternos = await getMascotaInterna(mascota.mascota_id, session.token);
      setMascotaEnEdicion(datosInternos);
      setFormVisible(true);
    } catch (error) {
      setActionError(error.message);
    } finally {
      setMascotaOcupadaId(null);
    }
  }

  async function handleEliminar(mascota) {
    const confirmar = window.confirm(`¿Seguro que quieres eliminar a ${mascota.mascota_nombreCompleto}?`);
    if (!confirmar) return;

    setActionError("");
    setActionMessage("");
    setMascotaOcupadaId(mascota.mascota_id);
    try {
      await eliminarMascota(mascota.mascota_id, session.token);
      setMascotas((actuales) => actuales.filter(
        (actual) => actual.mascota_id !== mascota.mascota_id
      ));
      setActionMessage(`${mascota.mascota_nombreCompleto} fue eliminada.`);
    } catch (error) {
      setActionError(error.message);
    } finally {
      setMascotaOcupadaId(null);
    }
  }

  async function handleEliminarSeleccionadas() {
    if (!puedeGestionar || !modoSeleccion || eliminandoVarias) {
      return;
    }

    const ids = mascotasVisibles
      .filter((mascota) => seleccionadas.includes(mascota.mascota_id))
      .map((mascota) => mascota.mascota_id);

    if (ids.length === 0) return;

    setEliminandoVarias(true);
    setActionError("");
    setActionMessage("");

    try {
      // 1. Revisar las relaciones del lote.
      const revision = await revisarMascotasLote(ids, session.token);

      const bloqueadas = revision.mascotas.filter((mascota) => mascota.estado === "bloqueada");

      const requierenConfirmacion =
        revision.mascotas.filter((mascota) => mascota.estado === "confirmacion");

      const confirmadas = [];

      // Excluir desde el comienzo las mascotas bloqueadas.
      const canceladas = bloqueadas.map((mascota) => mascota.id);

      // 2. Informar qué mascotas no pueden eliminarse.
      if (bloqueadas.length > 0) {
        const detalle = bloqueadas
          .map((mascota) => {
            const registros = mascota.registrosProtegidos
              .map((registro) => `${registro.tipo} (${registro.cantidad})`).join(", ");
            return (
              `- ${mascota.nombre} (ID ${mascota.id})\n` +
              `  Registros: ${registros}`
            );
          })
          .join("\n\n");

        window.alert(
          "Las siguientes mascotas no pueden eliminarse " +
          "porque tienen registros protegidos:\n\n" +
          detalle +
          "\n\nDebes gestionar sus registros desde los " +
          "módulos correspondientes antes de intentar " +
          "eliminarlas nuevamente.\n\n" +
          "Estas mascotas se excluirán automáticamente del lote."
        );
      }

      // 3. Solicitar confirmación individual
      // únicamente para relaciones en cascada.
      for (const mascota of requierenConfirmacion) {
        const detalle = mascota.registrosCascada
          .map((registro) => `- ${registro.tipo}: ${registro.cantidad}`).join("\n");
        const aceptar = window.confirm(
          `La mascota "${mascota.nombre}" tiene ` +
          "registros que se eliminarán automáticamente:\n\n" +
          detalle +
          "\n\n¿Deseas eliminar esta mascota junto con " +
          "sus registros asociados?\n\n" +
          "Esta acción no se puede deshacer."
        );

        if (aceptar) {
          confirmadas.push({id: mascota.id, firma: mascota.firma,});
        } else {
          canceladas.push(mascota.id);
        }
      }

      // 4. Calcular cuántas mascotas quedan autorizadas.
      const cantidadPorEliminar = ids.length - canceladas.length;

      if (cantidadPorEliminar > 0) {
        const confirmarLote = window.confirm(
          `¿Estás seguro que deseas eliminar ` + `${cantidadPorEliminar} ` + `${cantidadPorEliminar === 1
            ? "mascota"
            : "mascotas"}?\n\n` +
          "Esta acción es irreversible."
        );

        if (!confirmarLote) {
          setActionMessage("Operación cancelada. No se eliminó ninguna mascota.");
          return;
        }
      }

      // 5. El backend volverá a comprobar las relaciones.
      const resultado = await eliminarMascotasLote({ids, confirmadas, canceladas, }, session.token);

      if (!resultado || !Array.isArray(resultado.idsEliminados)) {
        throw new Error(
          "El backend confirmó la operación, pero no devolvió " +
          "la lista de IDs eliminados en el formato esperado. " +
          "Actualiza el catálogo antes de repetir la eliminación."
        );
      }

      // Usar un conjunto para consultar los IDs eliminados.
      const idsEliminados = new Set(
        resultado.idsEliminados.map(Number)
      );

      // 6. Quitar únicamente las mascotas eliminadas.
      setMascotas((actuales) =>
        actuales.filter((mascota) => !idsEliminados.has(Number(mascota.mascota_id) ))
      );

      // 7. Mostrar el resumen.
      setActionMessage(resultado.mensaje);

      if (resultado.bloqueadas?.length > 0) {
        const nombres = resultado.bloqueadas.map((mascota) => mascota.nombre).join(", ");

        setActionError(`No se eliminaron las siguientes mascotas ` + `porque tienen registros protegidos: ${nombres}.`);
      }

      setModoSeleccion(false);
      setSeleccionadas([]);

    } catch (error) {
        console.error("Error en eliminación múltiple:", error);

        const respuesta =
          error.cause?.response?.data ??
          error.response?.data;

        const codigo =
          error.cause?.response?.status ??
          error.response?.status;

        console.error("Código HTTP:", codigo);
        console.error("Respuesta del backend:", respuesta);

        if (respuesta?.details?.codigo === "REVISION_REQUERIDA") {
          setActionError(
            "Los registros asociados de una o más mascotas " +
            "requieren una nueva confirmación. " +
            "Vuelve a presionar Eliminar seleccionadas para " +
            "revisar la información actual."
          );
        } else {
          setActionError(
            respuesta?.message ||
            error.message ||
            "No se pudo procesar la eliminación múltiple."
          );
        }
      } finally {
      setEliminandoVarias(false);
      }
  }

  if (loading) return <p>Cargando mascotas...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="mascotas-page">
      <div className="mascotas-heading">
        <div>
          <h1>Nuestras Mascotas</h1>
          <p>Conoce a los animales que buscan un hogar.</p>
        </div>
        {puedeGestionar && (
          <div className="mascotas-heading-actions">
            <button
              type="button"
              className={`mascotas-btn-multiple ${
                modoSeleccion ? "activo" : ""
              }`}
              onClick={cambiarModoSeleccion}
              disabled={eliminandoVarias}
              aria-pressed={modoSeleccion}
            >
              <span aria-hidden="true">☑</span>
              {modoSeleccion ? "Cancelar selección" : "Seleccionar varias"}
            </button>
            
            <button
              className="btn-primary"
              type="button"
              disabled={modoSeleccion || eliminandoVarias}
              onClick={() => {
                setFormVisible((visible) => !visible);
                setMascotaEnEdicion(null);
                setFormError("");
                setSuccessMessage("");
                setActionError("");
                setActionMessage("");
              }}
            >
              {formVisible ? "Cancelar" : "Registrar mascota"}
            </button>
        </div>
      )}
      {puedeGestionar && modoSeleccion && (
        <div className="mascotas-seleccion-barra">

          <label className="mascotas-seleccionar-todas">
            <input
              type="checkbox"
              checked={
                mascotasVisibles.length > 0 &&
                seleccionadas.length === mascotasVisibles.length
              }
              onChange={(event) =>
                seleccionarTodas(event.target.checked)
              }
              disabled={
                eliminandoVarias ||
                mascotasVisibles.length === 0
              }
            />

            Seleccionar todas
          </label>

          <span className="mascotas-seleccion-contador">
            {seleccionadas.length} de {mascotasVisibles.length} seleccionadas
          </span>

          <button
            type="button"
            className="btn-danger mascotas-eliminar-multiple"
            onClick={handleEliminarSeleccionadas}
            disabled={
              seleccionadas.length === 0 ||
              eliminandoVarias
            }
          >
            {eliminandoVarias
              ? "Eliminando..."
              : `Eliminar seleccionadas (${seleccionadas.length})`}
          </button>

        </div>
        )}
    </div>
      {!puedeGestionar && session && (
        <p className="mascotas-access-note">
          La gestión de mascotas está disponible únicamente para el personal interno autorizado.
        </p>
      )}

      {puedeGestionar && formVisible && (
        <form
          key={mascotaEnEdicion?.mascota_id ?? "nueva-mascota"}
          ref={formRef}
          className="mascota-form"
          onSubmit={handleSubmit}
        >
          {/* Encabezado del formulario */}
          <div className="mascota-form-header">
            <h2>
              {mascotaEnEdicion
                ? "Editar mascota"
                : "Registrar nueva mascota"}
            </h2>

            <p>
              Completa la información de la mascota para
              mantener actualizado su registro en el refugio.
            </p>
          </div>

          {/* Campos del formulario */}
          <div className="mascota-form-grid">

            <label>
              Nombre
              <input
                name="mascota_nombreCompleto"
                type="text"
                placeholder="Ej: Rocky"
                maxLength={100}
                minLength={3}
                pattern="(?=(?:[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]*[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]){3,})(?=(?:\D*\d){0,2}\D*$)[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\d\s]{3,}"
                title="El nombre debe tener al menos 3 letras y solo puede contener letras y espacios."
                defaultValue={
                  mascotaEnEdicion?.mascota_nombreCompleto ?? ""
                }
                required
              />
            </label>

            <label>
              Especie
              <select
                name="mascota_especie"
                defaultValue={
                  mascotaEnEdicion?.mascota_especie ?? ""
                }
                required
              >
                <option value="" disabled>
                  Seleccione una especie
                </option>
                <option value="Perro">Perro</option>
                <option value="Gato">Gato</option>
              </select>
            </label>

            <label>
              Edad (años)
              <input
                name="mascota_edad"
                type="number"
                min="0"
                step="1"
                placeholder="Ej: 3"
                defaultValue={
                  mascotaEnEdicion?.mascota_edad ?? ""
                }
                required
              />
            </label>

            <label>
              Peso (kg)
              <input
                name="mascota_peso"
                type="number"
                min="0.01"
                step="any"
                placeholder="Ej: 12.5"
                defaultValue={
                  mascotaEnEdicion?.mascota_peso ?? ""
                }
                required
              />
            </label>

            <label>
              Sexo
              <select
                name="mascota_sexo"
                defaultValue={
                  mascotaEnEdicion?.mascota_sexo ?? ""
                }
                required
              >
                <option value="" disabled>
                  Seleccione el sexo
                </option>
                <option value="Hembra">Hembra</option>
                <option value="Macho">Macho</option>
              </select>
            </label>

            <label>
              Vía de ingreso
              <select
                name="mascota_viaIngreso"
                defaultValue={
                  mascotaEnEdicion?.mascota_viaIngreso ?? ""
                }
                required
              >
                <option value="" disabled>
                  Seleccione una vía de ingreso
                </option>
                <option value="Entrega voluntaria">
                  Entrega voluntaria
                </option>
                <option value="Decomiso municipal">
                  Decomiso municipal
                </option>
                <option value="Traslado">Traslado</option>
                <option value="Hallazgo en vía pública">
                  Hallazgo en vía pública
                </option>
              </select>
            </label>

            <label>
              Estado
              <select
                name="mascota_estado"
                defaultValue={
                  mascotaEnEdicion?.mascota_estado ?? ""
                }
                required
              >
                <option value="" disabled>
                  Seleccione un estado
                </option>
                <option value="En Refugio">En Refugio</option>
                <option value="En Tratamiento">
                  En Tratamiento
                </option>
                <option value="En Cuarentena">
                  En Cuarentena
                </option>
                <option value="En Observación">
                  En Observación
                </option>
                <option value="Adoptada">Adoptada</option>
              </select>
            </label>

            <label>
              URL de foto (opcional)
              <input
                name="mascota_fotoURL"
                type="url"
                placeholder="https://ejemplo.com/foto.jpg"
                maxLength="512"
                defaultValue={
                  mascotaEnEdicion?.mascota_fotoURL ?? ""
                }
              />
            </label>

            <label className="mascota-form-wide">
              Antecedentes previos
              <textarea
                name="mascota_antecedentesPrevios"
                maxLength="512"
                rows="4"
                placeholder="Describe antecedentes relevantes de la mascota..."
                defaultValue={
                  mascotaEnEdicion?.mascota_antecedentesPrevios ?? ""
                }
                required
              />
            </label>
          </div>

          {/* Mensajes de resultado */}
          {formError && (
            <p
              className="form-message form-error"
              role="alert"
            >
              {formError}
            </p>
          )}

          {successMessage && (
            <p
              className="form-message form-success"
              role="status"
            >
              {successMessage}
            </p>
          )}

          {/* Botón principal */}
          <button
            className="boton boton-primario mascota-form-submit"
            type="submit"
            disabled={saving}
          >
            {saving
              ? "Guardando..."
              : mascotaEnEdicion
                ? "Guardar cambios"
                : "Guardar mascota"}
          </button>

        </form>
      )}

      <div className="mascotas-grid">
        {mascotasVisibles.map((mascota) => (
          <MascotaCard
            key={mascota.mascota_id}
            mascota={mascota}
            puedeGestionar={puedeGestionar}
            onEditar={handleEditar}
            onEliminar={handleEliminar}
            ocupado={eliminandoVarias || mascotaOcupadaId === mascota.mascota_id}
            modoSeleccion={modoSeleccion}
            seleccionada={seleccionadas.includes(mascota.mascota_id)}
            onSeleccionar={alternarSeleccion}
          />
        ))}
      </div>
      {actionError && <p className="form-message form-error mascotas-mensaje-accion" role="alert">{actionError}</p>}
      {actionMessage && <p className="form-message form-success mascotas-mensaje-accion" role="status">{actionMessage}</p>}
      {mascotasVisibles.length === 0 && (
        <p>
          {puedeGestionar ? "Aún no hay mascotas registradas." : "Actualmente no hay mascotas disponibles para adopción."}
        </p>)
      }
    </div>
  );
};

export default NuestrasMascotas;