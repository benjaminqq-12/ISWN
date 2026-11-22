import { Clock3, MapPin } from 'lucide-react';
import { fechaLocal, fechaActualChile } from '../../helpers/formatoFecha.js';

const EventCard = ({ evento, inscrito, procesando, bloqueado, autenticado, onAccion, onDetalles }) => {
    const fecha = fechaLocal(evento.fechaEvento);

    const dia = fecha ? String(fecha.getDate()).padStart(2, '0') : '—';
    const mes = fecha ? fecha.toLocaleDateString('es-CL', { month: 'short' }) : 'S/F';
    const disponible = ['Activo', 'Programado'].includes(evento.estado) && fecha
        && evento.fechaEvento >= fechaActualChile() && evento.horaFin && evento.capacidadMaxima > 0;
    const lleno = evento.cuposDisponibles === 0;

    let textoBoton = 'Inscribirse';
    if (!disponible) textoBoton = 'Inscripciones cerradas';
    if (disponible && lleno) textoBoton = 'Cupos agotados';
    if (disponible && !lleno && !autenticado) textoBoton = 'Inicia sesión para inscribirte';
    if (inscrito) textoBoton = 'Cancelar inscripción';
    if (procesando) textoBoton = 'Procesando…';

    return (
        <article className="evento-card">
            <div className="evento-contenido">
                <div className="evento-cabecera">
                    <div className="evento-datos">
                        <div className="evento-fecha" aria-hidden="true">
                            <span className="evento-dia">{dia}</span>
                            <span className="evento-mes">{mes}</span>
                        </div>
                        <div className="evento-metadatos">
                            <p><Clock3 />{evento.horaInicio?.slice(0, 5) || 'Hora por confirmar'}
                                {evento.horaFin && ` – ${evento.horaFin}`}</p>
                            <p><MapPin />{evento.lugar || 'Lugar por confirmar'}</p>
                        </div>
                    </div>
                    <span className="evento-estado">{evento.estado}</span>
                </div>

                <h3>{evento.titulo}</h3>
                <p className="evento-descripcion">{evento.descripcion}</p>

                {evento.cuposDisponibles != null && (
                    <p className="evento-info">Cupos disponibles: {evento.cuposDisponibles} de {evento.capacidadMaxima}</p>
                )}
                <div className="evento-acciones">
                    <button
                        type="button"
                        className={inscrito ? 'boton boton-secundario' : 'boton boton-verde'}
                        disabled={bloqueado || (!inscrito && (!autenticado || !disponible || lleno))}
                        onClick={() => onAccion(evento.eventoId, inscrito)}
                    >
                        {textoBoton}
                    </button>
                    <button type="button" className="boton boton-secundario"
                        disabled={procesando} onClick={() => onDetalles(evento.eventoId)}>
                        Ver detalles
                    </button>
                </div>
            </div>
        </article>
    );
};

export default EventCard;
