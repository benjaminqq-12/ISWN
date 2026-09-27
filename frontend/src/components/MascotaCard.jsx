import '../styles/mascotas.css';

const MascotaCard = ({ mascota }) => {
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
      </div>
    </div>
  );
};

export default MascotaCard;