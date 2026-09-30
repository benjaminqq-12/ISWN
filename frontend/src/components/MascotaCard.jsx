import { useState } from 'react';
import '../styles/mascotas.css';
import { Link } from 'react-router-dom';
import SolicitudAdopcionForm from './SolicitudAdopcionForm';

const DEFAULT_PLACEHOLDER = '/placeholder-mascota.svg';

const MascotaCard = ({ mascota, puedeGestionar = false, onEditar, onEliminar, ocupado = false }) => {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);

  const {
    mascota_nombreCompleto,
    mascota_especie,
    mascota_edad,
    mascota_sexo,
    mascota_estado,
    mascota_fotoURL,
  } = mascota;
  const estadoClass = `estado-${(mascota_estado || '')
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll(" ", "-")
    .toLowerCase()}`;

  return (
    <article className="mascota-card">
      <div className="mascota-card-body">
        <Link className="mascota-card-link" to={`/mascotas/${mascota.mascota_id}`}>
          <div className="mascota-card-img">
            <img
              src={mascota_fotoURL || DEFAULT_PLACEHOLDER}
              alt={mascota_nombreCompleto}
              onError={(event) => {
                if (event.currentTarget.src !== window.location.origin + DEFAULT_PLACEHOLDER) {
                  event.currentTarget.src = DEFAULT_PLACEHOLDER;
                }
              }}
              loading="lazy"
            />
          </div>
          <h3 className="mascota-card-nombre">{mascota_nombreCompleto}</h3>
          <p className="mascota-card-detalle">
            {mascota_especie} · {mascota_edad} {mascota_edad === 1 ? "año" : "años"} · {mascota_sexo}
          </p>
          <span className={`mascota-card-estado ${estadoClass}`}>
            {mascota_estado}
          </span>
        </Link>

        {mascota_estado === "En Refugio" && !solicitudEnviada && (
          <button className="mascota-adoptar-button" type="button" onClick={() => setMostrarFormulario(true)}>
            Adoptar
          </button>
        )}
        {solicitudEnviada && <p>Solicitud enviada ✓</p>}
      </div>

      {puedeGestionar && (
        <div className="mascota-card-actions" role="group" aria-label={`Acciones para ${mascota_nombreCompleto}`}>
          <button className="btn-secondary" type="button" onClick={() => onEditar(mascota)} disabled={ocupado}>
            Editar
          </button>
          <button className="btn-danger" type="button" onClick={() => onEliminar(mascota)} disabled={ocupado}>
            Eliminar
          </button>
        </div>
      )}

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
    </article>
  );
};

export default MascotaCard;