import { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import {
    crearEvento,
    actualizarEvento,
    guardarBorradorEvento,
    publicarEvento,
    getEventosGestion,
    getOrganizadores
} from '../../services/evento.service.js';
import { fechaLocal } from '../../helpers/formatoFecha.js';
import Modal from './Modal.jsx';
import EventoFormulario from './eventoFormulario.jsx';

const EventoGestion = ({ session, onVerPublico }) => {
    const esAdmin = session.user.rol === 'Admin';
    const [eventos, setEventos] = useState([]);
    const [organizadores, setOrganizadores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [filtro, setFiltro] = useState('todos');
    const [busqueda, setBusqueda] = useState('');
    const [formularioVisible, setFormularioVisible] = useState(false);
    const [eventoEditar, setEventoEditar] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const [errorFormulario, setErrorFormulario] = useState('');

    const cargarGestion = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [respuestaEventos, respuestaOrganizadores] = await Promise.all([
                getEventosGestion(),
                esAdmin ? getOrganizadores() : Promise.resolve({ status: 'Success', data: [] })
            ]);
            if ([respuestaEventos, respuestaOrganizadores].some(respuesta => respuesta?.status !== 'Success')) {
                throw new Error('No se pudo cargar la gestión. Comprueba que tu sesión siga activa e intenta nuevamente.');
            }
            setEventos(respuestaEventos.data);
            setOrganizadores(respuestaOrganizadores.data);
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [esAdmin]);

    useEffect(() => {
        cargarGestion();
    }, [cargarGestion]);

    const abrirFormulario = (evento = null) => {
        setEventoEditar(evento);
        setErrorFormulario('');
        setMensaje('');
        setFormularioVisible(true);
    };

    const guardarEvento = async (datos, borrador = false) => {
        setGuardando(true);
        setErrorFormulario('');
        try {
            const respuesta = borrador
                ? await guardarBorradorEvento(eventoEditar?.eventoId, datos)
                : eventoEditar?.estado === 'Borrador'
                    ? await publicarEvento(eventoEditar.eventoId, datos)
                    : eventoEditar
                        ? await actualizarEvento(eventoEditar.eventoId, datos)
                        : await crearEvento(datos);

            if (respuesta?.status !== 'Success') {
                throw new Error(
                    typeof respuesta?.details === 'string'
                        ? respuesta.details
                        : respuesta?.message || 'No se pudo guardar el evento.'
                );
            }
            setFormularioVisible(false);
            setMensaje(
                borrador
                    ? 'Borrador guardado. Solo es visible en administración.'
                    : 'Evento guardado y publicado en el calendario.'
            );
            await cargarGestion();
        } catch (error) {
            setErrorFormulario(error.message);
        } finally {
            setGuardando(false);
        }
    };

    const activos = evento => ['Activo', 'Programado'].includes(evento.estado);
    const proximos = eventos.filter(evento => activos(evento) && !evento.puedeFinalizar).length;
    const porCerrar = eventos.filter(evento => evento.puedeFinalizar).length;
    const borradores = eventos.filter(evento => evento.estado === 'Borrador').length;
    const totalActivos = eventos.filter(evento => activos(evento)).length;

    const eventosFiltrados = eventos.filter(evento => {
        const coincideTexto = (evento.titulo || '').toLocaleLowerCase('es-CL').includes(busqueda.toLocaleLowerCase('es-CL'));
        const coincideFiltro = filtro === 'todos'
            || (filtro === 'borradores' && evento.estado === 'Borrador')
            || (filtro === 'proximos' && activos(evento) && !evento.puedeFinalizar)
            || (filtro === 'porCerrar' && evento.puedeFinalizar)
            || (filtro === 'finalizados' && evento.estado === 'Finalizado');
        return coincideTexto && coincideFiltro;
    });

    return (
        <div className="eventos-panel">
            <header className="eventos-cabecera">
                <div>
                    <p className="eventos-etiqueta">{esAdmin ? 'Administración' : 'Equipo de voluntarios'}</p>
                    <h1 className="titulo-seccion">{esAdmin ? 'Gestión de eventos' : 'Mis eventos asignados'}</h1>
                    <p className="descripcion-seccion">
                        {esAdmin
                            ? 'Crea actividades, guarda borradores y publica eventos verificando que no existan choques de horario.'
                            : 'Consulta las actividades donde estás asignado como organizador.'}
                    </p>
                </div>
                <div className="gestion-acciones">
                    {onVerPublico && (
                        <button type="button" className="boton boton-secundario" onClick={onVerPublico} disabled={guardando}>
                            Ver cartelera pública
                        </button>
                    )}
                    <button type="button" className="boton boton-secundario" onClick={cargarGestion} disabled={loading || guardando}>
                        <RefreshCw />Actualizar
                    </button>
                    {esAdmin && (
                        <button
                            type="button"
                            className="boton boton-primario"
                            onClick={() => abrirFormulario()}
                            disabled={loading || guardando || Boolean(error)}
                        >
                            <Plus />Ingresar evento
                        </button>
                    )}
                </div>
            </header>

            {mensaje && <p className="mensaje mensaje-exito" role="status">{mensaje}</p>}
            {error && (
                <div className="mensaje mensaje-error" role="alert">
                    <p>{error}</p>
                    <button type="button" className="boton boton-secundario" onClick={cargarGestion} disabled={loading || guardando}>
                        Reintentar
                    </button>
                </div>
            )}

            {loading ? (
                <p className="estado-pagina" role="status">Cargando gestión…</p>
            ) : (
                <>
                    <div className="gestion-resumen" aria-label="Resumen de actividades">
                        <div><span>Próximos</span><strong>{proximos}</strong></div>
                        <div><span>Publicados activos</span><strong>{totalActivos}</strong></div>
                        <div><span>Horario terminado</span><strong>{porCerrar}</strong></div>
                        <div><span>Eventos en borrador</span><strong>{borradores}</strong></div>
                    </div>

                    <section className="eventos-gestion" aria-labelledby="titulo-eventos-gestion">
                        <h2 className="gestion-subtitulo" id="titulo-eventos-gestion">
                            {esAdmin ? 'Actividades registradas' : 'Actividades a mi cargo'}
                        </h2>
                        <div className="gestion-filtros">
                            <label>Buscar actividad
                                <input
                                    type="search"
                                    value={busqueda}
                                    onChange={event => setBusqueda(event.target.value)}
                                    placeholder="Nombre del evento"
                                />
                            </label>
                            <label>Mostrar
                                <select value={filtro} onChange={event => setFiltro(event.target.value)}>
                                    <option value="todos">Todos los eventos</option>
                                    {esAdmin && <option value="borradores">Eventos en borrador</option>}
                                    <option value="proximos">Próximos</option>
                                    <option value="porCerrar">Horario terminado</option>
                                    <option value="finalizados">Finalizados</option>
                                </select>
                            </label>
                        </div>

                        {esAdmin && organizadores.length === 0 && (
                            <p className="mensaje mensaje-error">
                                Necesitas al menos un voluntario activo para poder publicar nuevas actividades. Aun así puedes guardar borradores.
                            </p>
                        )}

                        {eventosFiltrados.length === 0 ? (
                            <p className="estado-pagina">No hay actividades para mostrar con estos filtros.</p>
                        ) : (
                            <div className="eventos-tabla-scroll" tabIndex={0} role="region" aria-label="Eventos registrados">
                                <table className="eventos-tabla">
                                    <thead>
                                        <tr>
                                            <th>Actividad</th>
                                            <th>Fecha y horario</th>
                                            <th>Inscritos / capacidad</th>
                                            <th>Estado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {eventosFiltrados.map(evento => (
                                            <tr key={evento.eventoId}>
                                                <td>
                                                    <strong>{evento.titulo}</strong>
                                                    <span>{evento.organizador?.usuarioNombre || 'Organizador por definir'}</span>
                                                    <span>{evento.lugar || 'Lugar por definir'}</span>
                                                </td>
                                                <td>
                                                    {fechaLocal(evento.fechaEvento)?.toLocaleDateString('es-CL') || 'Fecha por definir'}
                                                    <span>{evento.horaInicio || 'Inicio por definir'} – {evento.horaFin || 'Término por definir'}</span>
                                                </td>
                                                <td>{evento.totalInscritos} / {evento.capacidadMaxima ?? 'Por definir'}</td>
                                                <td>
                                                    {evento.estado}
                                                    {evento.puedeFinalizar && <span>Horario terminado</span>}
                                                </td>
                                                <td>
                                                    <div className="gestion-acciones">
                                                        {esAdmin && evento.puedeEditar && (
                                                            <button
                                                                type="button"
                                                                className="boton boton-secundario"
                                                                disabled={guardando}
                                                                onClick={() => abrirFormulario(evento)}
                                                            >
                                                                {evento.estado === 'Borrador' ? 'Continuar evento' : 'Editar'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                </>
            )}

            {formularioVisible && (
                <Modal
                    titulo={eventoEditar ? (eventoEditar.estado === 'Borrador' ? 'Continuar borrador de evento' : 'Editar evento') : 'Ingresar evento'}
                    onClose={() => setFormularioVisible(false)}
                    bloqueado={guardando}
                >
                    <EventoFormulario
                        evento={eventoEditar}
                        organizadores={organizadores}
                        guardando={guardando}
                        error={errorFormulario}
                        onGuardar={guardarEvento}
                        onCancelar={() => setFormularioVisible(false)}
                    />
                </Modal>
            )}
        </div>
    );
};

export default EventoGestion;
