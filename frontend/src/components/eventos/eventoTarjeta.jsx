import { Clock3, MapPin } from 'lucide-react';
import { fechaLocal } from '../../helpers/formatoFecha.js';

const EventCard = ({ evento, inscrito, procesando, bloqueado, onAccion, onDetalles }) => {
    const fecha = fechaLocal(evento.fechaEvento);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const dia = fecha ? String(fecha.getDate()).padStart(2, '0') : '—';
    const mes = fecha ? fecha.toLocaleDateString('es-CL', { month: 'short' }) : 'S/F';
    const disponible = evento.estado === 'Programado' && fecha && fecha >= hoy;

    let textoBoton = 'Inscribirse gratis';
    if (!disponible) textoBoton = 'Inscripciones cerradas';
    if (inscrito) textoBoton = 'Cancelar inscripción';
    if (procesando) textoBoton = 'Procesando…';

    return (
        <article className="evento-card">
            <div className="evento-contenido">
                <div className="evento-cabecera">
                    <div className="evento-datos">
                        <div className="evento-fecha" aria-label={fecha?.toLocaleDateString('es-CL')}>
                            <span className="evento-dia">{dia}</span>
                            <span className="evento-mes">{mes}</span>
                        </div>
                        <div className="evento-metadatos">
                            <p><Clock3 />{evento.horaInicio?.slice(0, 5) || 'Hora por confirmar'}</p>
                            <p><MapPin />{evento.lugar || 'Lugar por confirmar'}</p>
                        </div>
                    </div>
                    <span className="evento-estado">{evento.estado || 'Por confirmar'}</span>
                </div>

                <h3>{evento.titulo}</h3>
                <p className="evento-descripcion">{evento.descripcion}</p>

                <div className="evento-acciones">
                    <button
                        type="button"
                        className={inscrito ? 'boton boton-secundario' : 'boton boton-verde'}
                        disabled={bloqueado || (!inscrito && !disponible)}
                        onClick={() => onAccion(evento.eventoId, inscrito)}
                    >
                        {textoBoton}
                    </button>
                    <button type="button" className="boton boton-secundario"
                        disabled={procesando} onClick={() => onDetalles(evento.eventoId)}>
                        Más información
                    </button>
                </div>
            </div>
        </article>
    );
};

export default EventCard;
