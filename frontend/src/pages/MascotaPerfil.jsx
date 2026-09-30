import { useEffect, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import { getMascota, getMascotaInterna } from '../services/mascota.service';
import SolicitudAdopcionForm from '../components/SolicitudAdopcionForm';
import '../styles/mascotas.css';

const DEFAULT_PLACEHOLDER = '/placeholder-mascota.svg';

const MascotaPerfil = () => {
  const { id } = useParams();
  const { session } = useOutletContext();
  const puedeVerInterno = ['Voluntario', 'Admin'].includes(session?.user?.rol);
  const [mascota, setMascota] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [errorInterno, setErrorInterno] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);

  useEffect(() => {
    let vigente = true;

    async function cargarMascota() {
      setLoading(true);
      setError('');
      setErrorInterno('');
      try {
        const datosPublicos = await getMascota(id);
        if (!vigente) return;
        setMascota(datosPublicos);

        if (puedeVerInterno && session?.token) {
          try {
            const datosInternos = await getMascotaInterna(id, session.token);
            if (vigente) setMascota(datosInternos);
          } catch (errorInterno) {
            if (vigente) setErrorInterno(errorInterno.message);
          }
        }
      } catch (errorCarga) {
        if (vigente) setError(errorCarga.message);
      } finally {
        if (vigente) setLoading(false);
      }
    }

    cargarMascota();
    return () => {
      vigente = false;
    };
  }, [id, puedeVerInterno, session?.token]);

  if (loading) return <p className="container mascota-feedback">Cargando perfil...</p>;
  if (error) {
    return (
      <section className="container mascota-feedback">
        <p role="alert">{error}</p>
        <Link className="mascota-perfil-back" to="/mascotas">
          <span aria-hidden="true">←</span> Volver a las mascotas
        </Link>
      </section>
    );
  }
  if (!mascota) return null;

  const estadoClass = `estado-${mascota.mascota_estado
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replaceAll(' ', '-')
    .toLowerCase()}`;

  return (
    <section className="container mascota-perfil">
      <Link className="mascota-perfil-back" to="/mascotas">
        <span aria-hidden="true">←</span> Volver a las mascotas
      </Link>
      <div className="mascota-perfil-main">
        <div className="mascota-perfil-image">
          <img
            src={mascota.mascota_fotoURL || DEFAULT_PLACEHOLDER}
            alt={mascota.mascota_nombreCompleto}
            onError={(e) => {
              if (e.currentTarget.src !== window.location.origin + DEFAULT_PLACEHOLDER) {
                e.currentTarget.src = DEFAULT_PLACEHOLDER;
              }
            }}
          />
        </div>
        <div className="mascota-perfil-info">
          <p className="mascota-perfil-eyebrow">Perfil de mascota</p>
          <h1>{mascota.mascota_nombreCompleto}</h1>
          <span className={`mascota-card-estado ${estadoClass}`}>
            {mascota.mascota_estado}
          </span>
          {mascota.mascota_estado === 'En Refugio' && !solicitudEnviada && (
            <button
              className="mascota-adoptar-button mascota-perfil-adoptar"
              type="button"
              onClick={() => setMostrarFormulario(true)}
            >
              Adoptar
            </button>
          )}
          {solicitudEnviada && <p className="form-message form-success" role="status">Solicitud enviada ✓</p>}
          <dl className="mascota-perfil-datos">
            <div><dt>Especie</dt><dd>{mascota.mascota_especie}</dd></div>
            <div><dt>Edad</dt><dd>{mascota.mascota_edad} {mascota.mascota_edad === 1 ? 'año' : 'años'}</dd></div>
            <div><dt>Peso</dt><dd>{mascota.mascota_peso} kg</dd></div>
            <div><dt>Sexo</dt><dd>{mascota.mascota_sexo}</dd></div>
          </dl>
          {puedeVerInterno && mascota.mascota_viaIngreso && (
            <div className="mascota-perfil-interno">
              <h2>Información interna</h2>
              <dl className="mascota-perfil-datos">
                <div><dt>Vía de ingreso</dt><dd>{mascota.mascota_viaIngreso}</dd></div>
                <div className="mascota-perfil-wide">
                  <dt>Antecedentes previos</dt>
                  <dd>{mascota.mascota_antecedentesPrevios || 'Sin antecedentes registrados.'}</dd>
                </div>
              </dl>
            </div>
          )}
          {errorInterno && <p className="form-message form-error" role="alert">{errorInterno}</p>}
        </div>
      </div>
      {mostrarFormulario && (
        <SolicitudAdopcionForm
          mascota={mascota}
          onClose={() => setMostrarFormulario(false)}
          onSuccess={() => {
            setMostrarFormulario(false);
            setSolicitudEnviada(true);
          }}
        />
      )}
    </section>
  );
};

export default MascotaPerfil;