import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import useEventos from '../hooks/eventos/useEventos.jsx';
import EventCard from '../components/eventos/eventoTarjeta.jsx';
import EventCalendar from '../components/eventos/eventoCalendario.jsx';
import Modal from '../components/eventos/Modal.jsx';
import { getEventoById, inscribirseEvento, cancelarInscripcion } from '../services/evento.service.js';
import { fechaLocal } from '../helpers/formatoFecha.js';
import '../styles/eventos.css';

const Eventos = () => {
    const { eventos, inscripciones, loading, error, errorInscripciones, refetch } = useEventos();
    const [procesandoId, setProcesandoId] = useState(null);
    const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
    const [verMisInscripciones, setVerMisInscripciones] = useState(false);
    const [mensaje, setMensaje] = useState(null);

    const verificarInscripcion = (eventoId) => {
        return inscripciones.some(inscripcion => String(inscripcion.evento?.eventoId) === String(eventoId));
    };

    const manejarInscripcion = async (eventoId, estaInscrito) => {
        if (procesandoId !== null || loading || errorInscripciones) return;
        if (estaInscrito && !window.confirm('¿Quieres cancelar tu inscripción en este evento?')) return;

        setProcesandoId(eventoId);
        setMensaje(null);

        try {
            const respuesta = estaInscrito
                ? await cancelarInscripcion(eventoId)
                : await inscribirseEvento(eventoId);

            if (respuesta?.status !== 'Success') {
                throw new Error(respuesta?.details || respuesta?.message || 'No se pudo realizar la operación.');
            }

            await refetch();
            setMensaje({
                tipo: 'exito',
                texto: estaInscrito ? 'Tu inscripción fue cancelada.' : 'Te inscribiste correctamente.'
            });
        } catch (error) {
            setMensaje({ tipo: 'error', texto: error.message });
        } finally {
            setProcesandoId(null);
        }
    };

    const verDetalles = async (eventoId) => {
        if (procesandoId !== null) return;
        setProcesandoId(eventoId);
        setMensaje(null);

        try {
            const respuesta = await getEventoById(eventoId);
            if (respuesta?.status !== 'Success' || !respuesta.data?.eventoId) {
                throw new Error(respuesta?.details || respuesta?.message || 'No se pudo obtener el evento.');
            }
            setEventoSeleccionado(respuesta.data);
        } catch (error) {
            setMensaje({ tipo: 'error', texto: error.message });
        } finally {
            setProcesandoId(null);
        }
    };

    const listaEventos = verMisInscripciones
        ? inscripciones.map(inscripcion => inscripcion.evento).filter(Boolean)
        : eventos;
    const errorVista = error || (verMisInscripciones ? errorInscripciones : null);
    const organizador = eventoSeleccionado?.organizador;
    const nombreOrganizador = organizador?.nombreCompleto
        || [organizador?.nombre, organizador?.apellido].filter(Boolean).join(' ');

    return (
        <div className="eventos-contenedor">
            <section className="eventos-hero">
                <div>
                    <p className="eventos-etiqueta">Comunidad y conexión</p>
                    <h1>Encuentros que<br />cambian <span>sus vidas</span></h1>
                    <p className="eventos-introduccion">
                        Únete a nuestras jornadas de adopción, campañas de salud preventiva y talleres de
                        adiestramiento. Cada evento está diseñado para acercar a nuestros peludos al calor de
                        un verdadero hogar y educar a la comunidad.
                    </p>
                    <div className="eventos-acciones">
                        <a href="#calendario" className="boton boton-primario">
                            <CalendarDays />Calendario de Eventos
                        </a>
                    </div>
                </div>
            </section>

            <section className="eventos-listado" aria-labelledby="titulo-lista">
                <div className="eventos-cabecera">
                    <div>
                        <h2 id="titulo-lista" className="titulo-seccion">
                            {verMisInscripciones ? 'Mis inscripciones' : 'Próximos Eventos Destacados'}
                        </h2>
                        <p className="descripcion-seccion">
                            {verMisInscripciones
                                ? 'Consulta los eventos en los que te has inscrito.'
                                : 'Descubre los próximos encuentros organizados por nuestra comunidad.'}
                        </p>
                    </div>
                    <button type="button" className="boton boton-secundario"
                        disabled={procesandoId !== null}
                        onClick={() => setVerMisInscripciones(!verMisInscripciones)}>
                        {verMisInscripciones ? 'Ver todos los eventos' : 'Ver mis inscripciones'}
                    </button>
                </div>

                {mensaje && (
                    <p className={`mensaje mensaje-${mensaje.tipo}`}
                        role={mensaje.tipo === 'error' ? 'alert' : 'status'}>
                        {mensaje.texto}
                    </p>
                )}

                {!loading && errorInscripciones && !verMisInscripciones && (
                    <div className="mensaje mensaje-error" role="alert">
                        <p>{errorInscripciones}</p>
                        <button type="button" className="boton boton-secundario" onClick={refetch}
                            disabled={procesandoId !== null}>Reintentar</button>
                    </div>
                )}

                {loading ? (
                    <p className="estado-pagina" role="status">Cargando eventos…</p>
                ) : errorVista ? (
                    <div className="estado-pagina" role="alert">
                        <h3>No pudimos cargar los eventos</h3>
                        <p>{errorVista}</p>
                        <button type="button" className="boton boton-primario" onClick={refetch}
                            disabled={procesandoId !== null}>Reintentar</button>
                    </div>
                ) : listaEventos.length === 0 ? (
                    <p className="estado-pagina">
                        {verMisInscripciones ? 'Todavía no tienes inscripciones.' : 'No hay eventos programados.'}
                    </p>
                ) : (
                    <div className="eventos-tarjetas">
                        {listaEventos.map(evento => (
                            <EventCard key={evento.eventoId} evento={evento}
                                inscrito={verificarInscripcion(evento.eventoId)}
                                procesando={procesandoId === evento.eventoId}
                                bloqueado={procesandoId !== null || Boolean(errorInscripciones)}
                                onAccion={manejarInscripcion} onDetalles={verDetalles} />
                        ))}
                    </div>
                )}
            </section>

            <EventCalendar eventos={errorVista ? [] : listaEventos} onDetalles={verDetalles}
                ocupado={loading || procesandoId !== null} loading={loading} error={errorVista} />

            {eventoSeleccionado && (
                <Modal onClose={() => setEventoSeleccionado(null)}>
                    <h3 className="titulo-seccion">{eventoSeleccionado.titulo}</h3>
                    <p className="evento-info">
                        {fechaLocal(eventoSeleccionado.fechaEvento)?.toLocaleDateString('es-CL', {
                            day: 'numeric', month: 'long', year: 'numeric'
                        })}
                        {' · '}{eventoSeleccionado.horaInicio?.slice(0, 5)}
                    </p>
                    <p className="evento-info">{eventoSeleccionado.lugar}</p>
                    <p className="evento-info">Estado: {eventoSeleccionado.estado}</p>
                    {nombreOrganizador && <p className="evento-info">Organiza: {nombreOrganizador}</p>}
                    <p className="evento-detalle">{eventoSeleccionado.descripcion}</p>
                </Modal>
            )}
        </div>
    );
};

export default Eventos;
