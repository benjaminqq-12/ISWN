import { useCallback, useEffect, useState } from 'react';
import { Plus, RefreshCw, Trash2 } from 'lucide-react';
import {
    crearEvento,
    actualizarEvento,
    guardarBorradorEvento,
    publicarEvento,
    getEventosGestion,
    getOrganizadores,
    getInscritosEvento,
    marcarAsistenciaEvento,
    eliminarEvento
} from '../../services/evento.service.js';
import { fechaLocal } from '../../helpers/formatoFecha.js';
import Modal from './Modal.jsx';
import EventoFormulario from './eventoFormulario.jsx';
import Paginacion from '../Paginacion.jsx';

const EventoGestion = ({ session, onVerPublico }) => {
    const esAdmin = session.user.rol === 'Admin';
    const [eventos, setEventos] = useState([]);
    const [organizadores, setOrganizadores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [filtro, setFiltro] = useState('todos');
    const [busqueda, setBusqueda] = useState('');
    const [pagina, setPagina] = useState(1);
    const [itemsPorPagina, setItemsPorPagina] = useState(10);
    const [formularioVisible, setFormularioVisible] = useState(false);
    const [eventoEditar, setEventoEditar] = useState(null);
    const [guardando, setGuardando] = useState(false);
    const [errorFormulario, setErrorFormulario] = useState('');
    const [eventoAsistencia, setEventoAsistencia] = useState(null);
    const [listaInscritos, setListaInscritos] = useState([]);
    const [cargandoAsistencia, setCargandoAsistencia] = useState(false);

    // Estados del modo eliminación múltiple
    const [modoEliminar, setModoEliminar] = useState(false);
    const [seleccionadosEliminar, setSeleccionadosEliminar] = useState([]);

    const abrirAsistencia = async (evento) => {
        setEventoAsistencia(evento);
        setCargandoAsistencia(true);
        try {
            const resp = await getInscritosEvento(evento.eventoId);
            if (resp?.status === 'Success') setListaInscritos(resp.data || []);
        } finally {
            setCargandoAsistencia(false);
        }
    };

    const toggleAsistencia = async (usuarioId, valorActual) => {
        const resp = await marcarAsistenciaEvento(eventoAsistencia.eventoId, usuarioId, !valorActual);
        if (resp?.status === 'Success') {
            setListaInscritos((prev) =>
                prev.map((item) =>
                    item.usuario?.usuarioId === usuarioId
                        ? { ...item, asistenciaConfirmada: !valorActual }
                        : item
                )
            );
        }
    };

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

    const toggleSeleccionEliminar = (eventoId) => {
        setSeleccionadosEliminar((prev) =>
            prev.includes(eventoId) ? prev.filter((id) => id !== eventoId) : [...prev, eventoId]
        );
    };

    const cancelarModoEliminar = () => {
        setModoEliminar(false);
        setSeleccionadosEliminar([]);
    };

    const manejarBotonEliminar = async () => {
        // Primer clic: activa el modo selección (botón pasa a rojo)
        if (!modoEliminar) {
            setModoEliminar(true);
            setSeleccionadosEliminar([]);
            setMensaje('');
            setError('');
            return;
        }

        // Segundo clic sin ningún evento marcado: sale del modo eliminar
        if (seleccionadosEliminar.length === 0) {
            cancelarModoEliminar();
            return;
        }

        // Segundo clic con eventos seleccionados: pide confirmación y borra
        const eventosABorrar = eventos.filter((e) => seleccionadosEliminar.includes(e.eventoId));
        const totalConInscritos = eventosABorrar.reduce((suma, e) => suma + Number(e.totalInscritos || 0), 0);
        const aviso =
            totalConInscritos > 0
                ? `¿Eliminar definitivamente ${eventosABorrar.length} evento(s)? Se notificará por correo a ${totalConInscritos} persona(s) inscrita(s).`
                : `¿Eliminar definitivamente ${eventosABorrar.length} evento(s) seleccionado(s)?`;

        if (!window.confirm(aviso)) return;

        setGuardando(true);
        setError('');
        setMensaje('');
        try {
            for (const id of seleccionadosEliminar) {
                const resp = await eliminarEvento(id);
                if (resp?.status !== 'Success') {
                    throw new Error(resp?.details || resp?.message || `No se pudo eliminar el evento #${id}.`);
                }
            }
            const cantidad = seleccionadosEliminar.length;
            cancelarModoEliminar();
            setMensaje(cantidad === 1 ? 'Evento eliminado correctamente.' : `${cantidad} eventos eliminados correctamente.`);
            await cargarGestion();
        } catch (err) {
            setError(err.message);
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

    const inicio = (pagina - 1) * itemsPorPagina;
    const eventosPaginados = eventosFiltrados.slice(inicio, inicio + itemsPorPagina);

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
                            disabled={loading || guardando || Boolean(error) || modoEliminar}
                        >
                            <Plus />Ingresar evento
                        </button>
                    )}
                    {esAdmin && (
                        <>
                            <button
                                type="button"
                                className={modoEliminar ? 'boton boton-peligro' : 'boton boton-secundario'}
                                disabled={loading || guardando}
                                onClick={manejarBotonEliminar}
                            >
                                <Trash2 />
                                {modoEliminar
                                    ? seleccionadosEliminar.length > 0
                                        ? `Eliminar (${seleccionadosEliminar.length})`
                                        : 'Eliminar'
                                    : 'Eliminar'}
                            </button>
                            {modoEliminar && (
                                <button
                                    type="button"
                                    className="boton boton-secundario"
                                    disabled={guardando}
                                    onClick={cancelarModoEliminar}
                                >
                                    Cancelar
                                </button>
                            )}
                        </>
                    )}
                </div>
            </header>

            {modoEliminar && (
                <p className="mensaje mensaje-error" role="status">
                    Modo eliminación activo: selecciona los eventos que deseas borrar y vuelve a presionar el botón rojo <strong>Eliminar</strong>.
                </p>
            )}
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
                                    onChange={(event) => {
                                        setBusqueda(event.target.value);
                                        setPagina(1);
                                    }}
                                    placeholder="Nombre del evento"
                                />
                            </label>
                            <label>Mostrar
                                <select
                                    value={filtro}
                                    onChange={(event) => {
                                        setFiltro(event.target.value);
                                        setPagina(1);
                                    }}
                                >
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
                            <>
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
                                            {eventosPaginados.map(evento => {
                                                const marcado = seleccionadosEliminar.includes(evento.eventoId);
                                                return (
                                                    <tr
                                                        key={evento.eventoId}
                                                        className={`${modoEliminar ? 'fila-modo-eliminar' : ''} ${marcado ? 'fila-seleccionada-eliminar' : ''}`}
                                                        onClick={modoEliminar ? () => toggleSeleccionEliminar(evento.eventoId) : undefined}
                                                    >
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
                                                        <td onClick={modoEliminar ? undefined : (e) => e.stopPropagation()}>
                                                            <div className="gestion-acciones">
                                                                {esAdmin && evento.puedeEditar && (
                                                                    <button
                                                                        type="button"
                                                                        className="boton boton-secundario"
                                                                        disabled={guardando || modoEliminar}
                                                                        onClick={() => abrirFormulario(evento)}
                                                                    >
                                                                        {evento.estado === 'Borrador' ? 'Continuar evento' : 'Editar'}
                                                                    </button>
                                                                )}
                                                                {evento.estado !== 'Borrador' && (
                                                                    <button
                                                                        type="button"
                                                                        className="boton boton-secundario"
                                                                        disabled={modoEliminar}
                                                                        onClick={() => abrirAsistencia(evento)}
                                                                    >
                                                                        Asistencia
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <Paginacion
                                    paginaActual={pagina}
                                    totalItems={eventosFiltrados.length}
                                    itemsPorPagina={itemsPorPagina}
                                    onCambiarPagina={setPagina}
                                    opcionesPorPagina={esAdmin ? [10, 25, 50] : null}
                                    onCambiarItemsPorPagina={esAdmin ? setItemsPorPagina : null}
                                />
                            </>
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

            {eventoAsistencia && (
                <Modal
                    titulo={`Asistencia: ${eventoAsistencia.titulo}`}
                    onClose={() => setEventoAsistencia(null)}
                    ancho="grande"
                >
                    {cargandoAsistencia ? (
                        <p className="evento-info">Cargando inscritos…</p>
                    ) : listaInscritos.length === 0 ? (
                        <p className="evento-info">No hay personas inscritas en este evento todavía.</p>
                    ) : (
                        <table className="eventos-tabla">
                            <thead>
                                <tr><th>Nombre</th><th>RUT</th><th>Correo</th><th>Asistió</th></tr>
                            </thead>
                            <tbody>
                                {listaInscritos.map((persona) => (
                                    <tr key={persona.inscripcionId}>
                                        <td>{persona.usuario?.usuarioNombre}</td>
                                        <td>{persona.usuario?.rut}</td>
                                        <td>{persona.usuario?.usuarioEmail}</td>
                                        <td>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={Boolean(persona.asistenciaConfirmada)}
                                                    onChange={() => toggleAsistencia(persona.usuario?.usuarioId, persona.asistenciaConfirmada)}
                                                />
                                                {persona.asistenciaConfirmada ? 'Presente' : 'Ausente'}
                                            </label>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </Modal>
            )}
        </div>
    );
};

export default EventoGestion;