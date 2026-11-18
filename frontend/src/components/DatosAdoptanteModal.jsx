import '../styles/mascotas.css';
import '../styles/solicitudes.css';

const DatosAdoptanteModal = ({ solicitud, onClose }) => {
  const adoptante = solicitud.solicitudAdopcion_usuarioAdoptante;
  const mascota = solicitud.solicitudAdopcion_mascotaAdoptada;
  const telefono = solicitud.solicitudAdopcion_telefono;
  const correo = solicitud.solicitudAdopcion_correo;
  const direccion = solicitud.solicitudAdopcion_direccion;
  const mascotasActuales = solicitud.solicitudAdopcion_mascotasActuales;
  const motivo = solicitud.solicitudAdopcion_motivoAdopcion;

  const sinDatos = !telefono && !correo && !direccion && !mascotasActuales && !motivo;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content sol-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Datos del adoptante</h2>
        <p>
          {adoptante?.usuarioNombre ?? "—"} · solicitud #{solicitud.solicitudAdopcion_id}
          {mascota ? ` · ${mascota.mascota_nombreCompleto}` : ""}
        </p>

        {sinDatos ? (
          <p>Esta solicitud no tiene datos de contacto.</p>
        ) : (
          <dl className="sol-datos">
            <div>
              <dt>Teléfono</dt>
              <dd>{telefono ? <a href={`tel:${telefono.replace(/\s/g, '')}`}>{telefono}</a> : "—"}</dd>
            </div>
            <div>
              <dt>Correo</dt>
              <dd>{correo ? <a href={`mailto:${correo}`}>{correo}</a> : "—"}</dd>
            </div>
            <div>
              <dt>Dirección</dt>
              <dd>{direccion || "—"}</dd>
            </div>
            <div>
              <dt>Mascotas que tiene</dt>
              <dd>{mascotasActuales || "—"}</dd>
            </div>
            <div>
              <dt>Por qué quiere adoptar</dt>
              <dd>{motivo || "—"}</dd>
            </div>
          </dl>
        )}

        <div className="modal-actions">
          <button type="button" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default DatosAdoptanteModal;