import { useState } from 'react';
import '../styles/mascotas.css';
import SolicitudAdopcionForm from './SolicitudAdopcionForm';

const MascotaCard = ({ mascota }) => {
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

  return (
    <div className="mascota-card">
      <div className="mascota-card-img">
        <img
          src={mascota_fotoURL || "/placeholder-mascota.png"}
          alt={mascota_nombreCompleto}
        />
      </div>
      <div className="mascota-card-body">
        <h3 className="mascota-card-nombre">{mascota_nombreCompleto}</h3>
        <p className="mascota-card-detalle">
          {mascota_especie} · {mascota_edad} {mascota_edad === 1 ? "año" : "años"} · {mascota_sexo}
        </p>
        <span className={`mascota-card-estado estado-${mascota_estado.replaceAll(" ", "-").toLowerCase()}`}>
          {mascota_estado}
        </span>

        {mascota_estado === "En Refugio" && !solicitudEnviada && (
          <button onClick={() => setMostrarFormulario(true)}>
            Adoptar
          </button>
        )}
        {solicitudEnviada && <p>Solicitud enviada ✓</p>}
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
    </div>
  );
};

export default MascotaCard;