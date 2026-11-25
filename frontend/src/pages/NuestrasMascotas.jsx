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
          <button
            className="btn-primary"
            type="button"
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
                maxLength="100"
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
            ocupado={mascotaOcupadaId === mascota.mascota_id}
          />
        ))}
      </div>
      {actionError && <p className="form-message form-error" role="alert">{actionError}</p>}
      {actionMessage && <p className="form-message form-success" role="status">{actionMessage}</p>}
      {mascotasVisibles.length === 0 && (
        <p>
          {puedeGestionar ? "Aún no hay mascotas registradas." : "Actualmente no hay mascotas disponibles para adopción."}
        </p>)
      }
    </div>
  );
};

export default NuestrasMascotas;