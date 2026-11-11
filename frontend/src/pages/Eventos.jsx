import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import EventoGestion from '../components/eventos/eventoGestion.jsx';
import { CalendarDays } from 'lucide-react';
import useEventos from '../hooks/eventos/useEventos.jsx';
import EventCard from '../components/eventos/eventoTarjeta.jsx';
import EventCalendar from '../components/eventos/eventoCalendario.jsx';
import Modal from '../components/eventos/Modal.jsx';
import { getEventoById, inscribirseEvento, cancelarInscripcion } from '../services/evento.service.js';
import { fechaLocal, fechaActualChile } from '../helpers/formatoFecha.js';
import '../styles/eventos.css';

const EventosContenido = ({ session, abrirLogin, esEquipo, onVolverGestion }) => {
    const autenticado = Boolean(session?.token);
    const { eventos, inscripciones, loading, error, errorInscripciones, refetch } = useEventos(autenticado);
    const [eventoReserva, setEventoReserva] = useState(null);
    const [errorReserva, setErrorReserva] = useState('');
    const [procesandoId, setProcesandoId] = useState(null);
    const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
    const [verMisInscripciones, setVerMisInscripciones] = useState(false);
    const [mensaje, setMensaje] = useState(null);

    const verificarInscripcion = (eventoId) => {
        return inscripciones.some(inscripcion => inscripcion.evento?.eventoId === eventoId);
    };

    const manejarInscripcion = async (eventoId, estaInscrito) => {
        if (!autenticado || procesandoId !== null || loading || errorInscripciones) return;
        if (estaInscrito && !window.confirm('¿Quieres cancelar tu inscripción en este evento?')) return;

        setProcesandoId(eventoId);
        setMensaje(null);
        setErrorReserva('');

        try {
            const respuesta = estaInscrito
                ? await cancelarInscripcion(eventoId)
                : await inscribirseEvento(eventoId);

            if (respuesta?.status !== 'Success') {
                throw new Error(typeof respuesta?.details === 'string' ? respuesta.details : respuesta?.message || 'No se pudo realizar la operación.');
            }

            setEventoReserva(null);
            await refetch();
            setMensaje({
                tipo: 'exito',
                texto: estaInscrito ? 'Tu inscripción fue cancelada.' : 'Te inscribiste correctamente.'
            });
        } catch (error) {
            if (!estaInscrito) setErrorReserva(error.message);
            else setMensaje({ tipo: 'error', texto: error.message });
            await refetch();
        } finally {
            setProcesandoId(null);
        }
    };

    const verDetalles = async (eventoId) => {
        if (procesandoId !== null) return;

        const eventoEnLista = eventos.find(evento => evento.eventoId === eventoId)
            || inscripciones.map(inscripcion => inscripcion.evento).find(evento => evento?.eventoId === eventoId);

        setProcesandoId(eventoId);
        try {
            const respuesta = await getEventoById(eventoId);
            if (respuesta?.status === 'Success' && respuesta.data) {
                setEventoSeleccionado(respuesta.data);
            } else if (eventoEnLista) {
                setEventoSeleccionado(eventoEnLista);
            } else {
                setMensaje({ tipo: 'error', texto: respuesta?.message || 'No se pudo cargar el detalle del evento.' });
            }
        } finally {
            setProcesandoId(null);
        }
    };

    const prepararInscripcion = (eventoId, estaInscrito) => {
        if (!autenticado) return;
        if (estaInscrito) {
            manejarInscripcion(eventoId, true);
            return;
        }
        const evento = eventos.find(item => item.eventoId === eventoId);
        if (!evento || !evento.horaFin || !evento.capacidadMaxima || evento.cuposDisponibles <= 0) return;
        setErrorReserva('');
        setEventoReserva(evento);
    };

    const listaEventos = verMisInscripciones
        ? inscripciones.map(inscripcion => eventos.find(evento => evento.eventoId === inscripcion.evento?.eventoId)
            || inscripcion.evento).filter(Boolean)
        : eventos;
    const errorVista = error || (verMisInscripciones ? errorInscripciones : null);
    const organizador = eventoSeleccionado?.organizador;
    const nombreOrganizador = organizador?.usuarioNombre || organizador?.nombreCompleto
        || [organizador?.nombre, organizador?.apellido].filter(Boolean).join(' ');

    return (
        <div className="eventos-contenedor">
            {esEquipo && onVolverGestion && (
                <div className="eventos-selector">
                    <p className="evento-info">Estás viendo la cartelera pública de eventos.</p>
                    <button type="button" className="boton boton-secundario" onClick={onVolverGestion}>
                        Volver al panel de gestión
                    </button>
                </div>
            )}

            <section className="eventos-hero" aria-labelledby="titulo-eventos">
                <div>
                    <p className="eventos-etiqueta">Comunidad animalista · Bio Bío</p>
                    <h1 id="titulo-eventos">
                        Ferias de adopción y <span>talleres comunitarios.</span>
                    </h1>
                    <p className="eventos-introduccion">
                        Participa en nuestras jornadas presenciales, conoce a los rescatados y
                        aprende sobre tenencia responsable junto a voluntarios y veterinarios.
                    </p>
                    <div className="eventos-acciones">
                        <a href="#proximos-eventos" className="boton boton-primario">
                            Ver próximos eventos
                        </a>
                        <a href="#calendario" className="boton boton-secundario">
                            <CalendarDays />Ir al calendario
                        </a>
                    </div>
                </div>
            </section>

            {!autenticado && (
                <div className="eventos-selector">
                    <p className="evento-info">Puedes consultar los eventos libremente. Para inscribirte necesitas una cuenta e iniciar sesión.</p>
                    <button type="button" className="boton boton-secundario" onClick={abrirLogin}>Iniciar sesión</button>
                </div>
            )}

            <section className="eventos-listado" aria-labelledby="titulo-lista">
                <div className="eventos-cabecera">
                    <div>
                        <h2 id="titulo-lista" className="titulo-seccion">
                            {verMisInscripciones ? 'Mis inscripciones' : 'Próximos eventos'}
                        </h2>
                        <p className="descripcion-seccion">
                            {verMisInscripciones
                                ? 'Eventos en los que tienes un cupo reservado.'
                                : 'Descubre los próximos encuentros organizados por nuestra comunidad.'}
                        </p>
                    </div>
                    {autenticado && (
                        <button type="button" className="boton boton-secundario"
                            disabled={procesandoId !== null}
                            onClick={() => setVerMisInscripciones(!verMisInscripciones)}>
                            {verMisInscripciones ? 'Ver todos los eventos' : 'Ver mis inscripciones'}
                        </button>
                    )}
                </div>

                {mensaje && (
                    <div className={`mensaje ${mensaje.tipo === 'exito' ? 'mensaje-exito' : 'mensaje-error'}`} role="status">
                        <p>{mensaje.texto}</p>
                        <button type="button" className="boton boton-secundario" onClick={() => setMensaje(null)}>
                            Cerrar
                        </button>
                    </div>
                )}

                {!verMisInscripciones && errorInscripciones && !error && (
                    <div className="mensaje mensaje-error" role="alert">
                        <p>{errorInscripciones}</p>
                        <button type="button" className="boton boton-secundario" onClick={refetch}>
                            Reintentar
                        </button>
                    </div>
                )}

                {loading ? (
                    <p id="proximos-eventos" className="estado-pagina" role="status">Cargando eventos…</p>
                ) : errorVista ? (
                    <div id="proximos-eventos" className="estado-pagina" role="alert">
                        <h3>No pudimos cargar los eventos</h3>
                        <p>{errorVista}</p>
                        <button type="button" className="boton boton-primario" onClick={refetch}>
                            Reintentar
                        </button>
                    </div>
                ) : listaEventos.length === 0 ? (
                    <div id="proximos-eventos" className="estado-pagina">
                        <h3>{verMisInscripciones ? 'Aún no tienes inscripciones' : 'No hay eventos programados'}</h3>
                        <p>
                            {verMisInscripciones
                                ? 'Revisa la cartelera general para reservar tu lugar en las próximas jornadas.'
                                : 'Pronto publicaremos nuevas actividades comunitarias.'}
                        </p>
                    </div>
                ) : (
                    <div id="proximos-eventos" className="eventos-tarjetas">
                        {listaEventos.map(evento => (
                            <EventCard key={evento.eventoId} evento={evento}
                                inscrito={verificarInscripcion(evento.eventoId)}
                                procesando={procesandoId === evento.eventoId}
                                bloqueado={procesandoId !== null || Boolean(errorInscripciones)}
                                autenticado={autenticado} onAccion={prepararInscripcion} onDetalles={verDetalles} />
                        ))}
                    </div>
                )}
            </section>

            <EventCalendar eventos={error ? [] : eventos} onDetalles={verDetalles}
                ocupado={loading || procesandoId !== null} loading={loading} error={error} />

            {autenticado && eventoReserva && (
                <Modal titulo="Confirmar reserva" onClose={() => setEventoReserva(null)} bloqueado={procesandoId !== null}>
                    <form onSubmit={(event) => { event.preventDefault(); manejarInscripcion(eventoReserva.eventoId, false); }}>
                        <h3 className="titulo-seccion">{eventoReserva.titulo}</h3>
                        <p className="evento-info">{fechaLocal(eventoReserva.fechaEvento)?.toLocaleDateString('es-CL')}
                            {' · '}{eventoReserva.horaInicio} – {eventoReserva.horaFin}</p>
                        <p className="evento-info">{eventoReserva.lugar}</p>
                        <p className="evento-info">La reserva se registrará con tu cuenta: {session.user.usuarioNombre}.</p>
                        {errorReserva && <p className="mensaje mensaje-error" role="alert">{errorReserva}</p>}
                        <div className="evento-acciones">
                            <button type="submit" className="boton boton-verde"
                                disabled={loading || procesandoId !== null || Boolean(errorInscripciones)
                                    || !eventos.some(evento => evento.eventoId === eventoReserva.eventoId
                                        && evento.cuposDisponibles > 0 && evento.fechaEvento >= fechaActualChile())}>
                                {procesandoId !== null ? 'Procesando…' : 'Confirmar inscripción'}
                            </button>
                            <button type="button" className="boton boton-secundario"
                                disabled={procesandoId !== null} onClick={() => setEventoReserva(null)}>Volver</button>
                        </div>
                    </form>
                </Modal>
            )}

            {eventoSeleccionado && (
                <Modal onClose={() => setEventoSeleccionado(null)}>
                    <h3 className="titulo-seccion">{eventoSeleccionado.titulo}</h3>
                    <p className="evento-info">
                        {fechaLocal(eventoSeleccionado.fechaEvento)?.toLocaleDateString('es-CL', {
                            day: 'numeric', month: 'long', year: 'numeric'
                        })}
                        {' · '}{eventoSeleccionado.horaInicio?.slice(0, 5)}
                        {eventoSeleccionado.horaFin && ` – ${eventoSeleccionado.horaFin}`}
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

const Eventos = () => {
    const { session, abrirLogin } = useOutletContext();
    const [verPublico, setVerPublico] = useState(false);
    const esEquipo = Boolean(session?.token && ['Admin', 'Voluntario'].includes(session.user?.rol));

    if (esEquipo && !verPublico) {
        return (
            <div className="eventos-contenedor">
                <EventoGestion
                    key={session.token}
                    session={session}
                    onVerPublico={() => setVerPublico(true)}
                />
            </div>
        );
    }

    return (
        <EventosContenido
            key={session?.token || 'publico'}
            session={session}
            abrirLogin={abrirLogin}
            esEquipo={esEquipo}
            onVolverGestion={() => setVerPublico(false)}
        />
    );
};

export default Eventos;
