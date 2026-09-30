import '../styles/mascotas.css';
import { Link } from 'react-router-dom';

const DEFAULT_PLACEHOLDER = '/placeholder-mascota.svg';

const MascotaCard = ({ mascota, puedeGestionar = false, onEditar, onEliminar, ocupado = false }) => {
  const {
    mascota_nombreCompleto,
    mascota_especie,
    mascota_edad,
    mascota_sexo,
    mascota_estado,
    mascota_fotoURL,
  } = mascota;
  const estadoClass = `estado-${mascota_estado
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll(" ", "-")
    .toLowerCase()}`;

  return (
    <article className="mascota-card">
      <Link className="mascota-card-link" to={`/mascotas/${mascota.mascota_id}`}>
      <div className="mascota-card-img">
        <img
          src={mascota_fotoURL || DEFAULT_PLACEHOLDER}
          alt={mascota_nombreCompleto}
          onError={(e) => {
            if (e.currentTarget.src !== window.location.origin + DEFAULT_PLACEHOLDER) {
              e.currentTarget.src = DEFAULT_PLACEHOLDER;
            }
          }}
          loading="lazy"
        />
      </div>
      <div className="mascota-card-body">
        <h3 className="mascota-card-nombre">{mascota_nombreCompleto}</h3>
        <p className="mascota-card-detalle">
          {mascota_especie} · {mascota_edad} {mascota_edad === 1 ? "año" : "años"} · {mascota_sexo}
        </p>
        <span className={`mascota-card-estado ${estadoClass}`}>
          {mascota_estado}
        </span>
      </div>
      </Link>
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
    </article>
  );
};

export default MascotaCard;