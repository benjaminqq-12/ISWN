import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import MascotaCard from '../components/MascotaCard.jsx';
import { crearMascota, getMascotas } from '../services/mascota.service';

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
  const puedeRegistrar = ["Voluntario", "Admin"].includes(session?.user?.rol);

  useEffect(() => {
    getMascotas()
      .then(setMascotas)
      .catch(() => setError("No se pudieron cargar las mascotas."))
      .finally(() => setLoading(false));
  }, []);

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
      const mascotaCreada = await crearMascota(mascota, session.token);
      setMascotas((actuales) => [mascotaCreada, ...actuales]);
      setSuccessMessage("La mascota se registró correctamente.");
      form.reset();
    } catch (submitError) {
      setFormError(submitError.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Cargando mascotas...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="container">
      <div className="mascotas-heading">
        <div>
          <h1>Nuestras Mascotas</h1>
          <p>Conoce a los animales que buscan un hogar.</p>
        </div>
        {puedeRegistrar && (
          <button
            className="btn-primary"
            type="button"
            onClick={() => {
              setFormVisible((visible) => !visible);
              setFormError("");
              setSuccessMessage("");
            }}
          >
            {formVisible ? "Cancelar" : "Registrar mascota"}
          </button>
        )}
      </div>
      {!puedeRegistrar && (
        <p className="mascotas-access-note">
          {session
            ? "El registro de mascotas está habilitado solo para Voluntarios y Administradores."
            : "Inicia sesión como Voluntario o Administrador para registrar una mascota."}
        </p>
      )}

      {puedeRegistrar && formVisible && (
        <form className="mascota-form" onSubmit={handleSubmit}>
          <h2>Datos de la mascota</h2>
          <div className="mascota-form-grid">
            <label>
              Nombre
              <input name="mascota_nombreCompleto" maxLength="100" required />
            </label>
            <label>
              Especie
              <select name="mascota_especie" defaultValue="" required>
                <option value="" disabled>Seleccione una especie</option>
                <option value="Perro">Perro</option>
                <option value="Gato">Gato</option>
              </select>
            </label>
            <label>
              Edad (años)
              <input name="mascota_edad" type="number" min="0" step="1" required />
            </label>
            <label>
              Peso (kg)
              <input name="mascota_peso" type="number" min="0.01" step="any" required />
            </label>
            <label>
              Sexo
              <select name="mascota_sexo" defaultValue="" required>
                <option value="" disabled>Seleccione el sexo</option>
                <option value="Hembra">Hembra</option>
                <option value="Macho">Macho</option>
              </select>
            </label>
            <label>
              Vía de ingreso
              <select name="mascota_viaIngreso" defaultValue="" required>
                <option value="" disabled>Seleccione una vía de ingreso</option>
                <option value="Entrega voluntaria">Entrega voluntaria</option>
                <option value="Decomiso municipal">Decomiso municipal</option>
                <option value="Traslado">Traslado</option>
                <option value="Hallazgo en vía pública">Hallazgo en vía pública</option>
              </select>
            </label>
            <label>
              Estado
              <select name="mascota_estado" defaultValue="" required>
                <option value="" disabled>Seleccione un estado</option>
                <option value="En Tratamiento">En Tratamiento</option>
                <option value="En Cuarentena">En Cuarentena</option>
                <option value="En adopción">En adopción</option>
              </select>
            </label>
            <label>
              URL de foto (opcional)
              <input name="mascota_fotoURL" type="url" maxLength="512" />
            </label>
            <label className="mascota-form-wide">
              Antecedentes previos
              <textarea name="mascota_antecedentesPrevios" maxLength="512" rows="3" required />
            </label>
          </div>
          {formError && <p className="form-message form-error" role="alert">{formError}</p>}
          {successMessage && <p className="form-message form-success" role="status">{successMessage}</p>}
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar mascota"}
          </button>
        </form>
      )}

      <div className="mascotas-grid">
        {mascotas.map((mascota) => (
          <MascotaCard key={mascota.mascota_id} mascota={mascota} />
        ))}
      </div>
      {mascotas.length === 0 && <p>Aún no hay mascotas registradas.</p>}
    </div>
  );
};

export default NuestrasMascotas;