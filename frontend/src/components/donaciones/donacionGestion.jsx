import { useCallback, useEffect, useState } from 'react';
import { Download, RefreshCw, HeartHandshake, Wallet, CalendarDays, Users, CheckCircle2, Trash2 } from 'lucide-react';
import {
    getRecaudaciones,
    descargarListado,
    confirmarDonacion,
    descartarDonacionPendiente,
    desactivarSuscripcion,
} from '../../services/donacion.service.js';
import Modal from '../eventos/Modal.jsx';

const pesos = (valor) => Number(valor || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
const fecha = (valor) =>
    new Date(valor).toLocaleString('es-CL', {
        timeZone: 'America/Santiago',
        dateStyle: 'medium',
        timeStyle: 'short',
    });
const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const DonacionGestion = ({ session, onVerFormulario }) => {
    const esAdmin = session.user.rol === 'Admin';
    const [anio, setAnio] = useState(
        new Intl.DateTimeFormat('en-US', { timeZone: 'America/Santiago', year: 'numeric' }).format(new Date())
    );
    const [mes, setMes] = useState('');
    const [datos, setDatos] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [ocupado, setOcupado] = useState(false);
    const [seleccionada, setSeleccionada] = useState(null);
    const [motivo, setMotivo] = useState('');
    const [pagina, setPagina] = useState(1);
    const [tab, setTab] = useState('pendientes');

    const cargar = useCallback(async () => {
        setCargando(true);
        setError('');
        const resultado = await getRecaudaciones({ anio, ...(mes ? { mes } : {}) });
        if (resultado.status === 'Success') {
            setDatos(resultado.data);
            setPagina(1);
        } else {
            setDatos(null);
            setError(resultado.message || 'No se pudo consultar la recaudación.');
        }
        setCargando(false);
    }, [anio, mes]);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const aprobarDonacion = async (donacion) => {
        const descripcion = donacion.categoriaDonacion === 'Insumo'
            ? `la entrega de insumos (${donacion.detalleInsumo})`
            : `la transferencia de ${pesos(donacion.monto)}`;
        if (!window.confirm(`¿Confirmar que se recibió ${descripcion} de ${donacion.nombreDonante} (Donación #${donacion.donacionId})?`)) {
            return;
        }
        setOcupado(true);
        setError('');
        setMensaje('');
        const respuesta = await confirmarDonacion(donacion.donacionId);
        if (respuesta.status === 'Success') {
            setMensaje(respuesta.message || `Donación #${donacion.donacionId} marcada como completada.`);
            await cargar();
        } else {
            setError(respuesta.message || 'No se pudo confirmar la donación.');
        }
        setOcupado(false);
    };

    const descartarPendiente = async (donacion) => {
        if (!window.confirm(`¿Descartar y eliminar la solicitud pendiente #${donacion.donacionId} de ${donacion.nombreDonante}?`)) {
            return;
        }
        setOcupado(true);
        setError('');
        setMensaje('');
        const respuesta = await descartarDonacionPendiente(donacion.donacionId);
        if (respuesta.status === 'Success') {
            setMensaje(respuesta.message || `Solicitud #${donacion.donacionId} descartada.`);
            await cargar();
        } else {
            setError(respuesta.message || 'No se pudo descartar la solicitud.');
        }
        setOcupado(false);
    };

    const exportar = async (listado) => {
        setOcupado(true);
        setError('');
        try {
            await descargarListado({ anio, ...(mes ? { mes } : {}) }, listado);
        } catch {
            setError('No se pudo descargar el listado. Comprueba tu sesión e intenta nuevamente.');
        } finally {
            setOcupado(false);
        }
    };

    const desactivar = async (event) => {
        event.preventDefault();
        setOcupado(true);
        setError('');
        const respuesta = await desactivarSuscripcion(seleccionada.suscripcionId, motivo);
        if (respuesta.status === 'Success') {
            setSeleccionada(null);
            setMensaje(respuesta.message);
            await cargar();
        } else {
            setError(respuesta.message || 'No se pudo desactivar el apadrinamiento.');
        }
        setOcupado(false);
    };

    const bloqueado = cargando || ocupado;

    return (
        <div className="donaciones-gestion">
            <header className="eventos-cabecera">
                <div>
                    <p className="donaciones-etiqueta">{esAdmin ? 'Administración' : 'Equipo de voluntarios'}</p>
                    <h1 className="titulo-seccion">Recaudaciones y padrinos</h1>
                    <p className="descripcion-seccion">
                        Verifica las transferencias y entregas de insumos pendientes (expiran a las 48 h) y consulta los aportes confirmados.
                    </p>
                </div>
                <div className="gestion-acciones">
                    {onVerFormulario && (
                        <button type="button" className="boton boton-secundario" onClick={onVerFormulario} disabled={bloqueado}>
                            Ver formulario de donación
                        </button>
                    )}
                    <button type="button" className="boton boton-secundario" onClick={cargar} disabled={bloqueado}>
                        <RefreshCw />Actualizar
                    </button>
                </div>
            </header>

            <div className="donaciones-periodo">
                <label>
                    Año
                    <select
                        aria-label="Año"
                        value={anio}
                        disabled={bloqueado}
                        onChange={(event) => setAnio(event.target.value)}
                    >
                        {Array.from({ length: new Date().getFullYear() - 2020 + 2 }, (_, i) => new Date().getFullYear() + 1 - i).map(
                            (valor) => (
                                <option key={valor} value={valor}>{valor}</option>
                            )
                        )}
                    </select>
                </label>
                <label>
                    Período
                    <select value={mes} disabled={bloqueado} onChange={(event) => setMes(event.target.value)}>
                        <option value="">Todo el año</option>
                        {meses.map((nombre, indice) => (
                            <option key={nombre} value={indice + 1}>{nombre}</option>
                        ))}
                    </select>
                </label>
                <p>El total recaudado solo suma las donaciones económicas que ya fueron marcadas como Completadas.</p>
            </div>

            {mensaje && <p className="mensaje mensaje-exito" role="status">{mensaje}</p>}
            {error && <p className="mensaje mensaje-error" role="alert">{error}</p>}

            {cargando ? (
                <p className="estado-pagina" role="status">Cargando recaudaciones…</p>
            ) : (
                datos && (
                    <>
                        <div className="donaciones-indicadores">
                            <article>
                                <Wallet />
                                <span>Total recaudado</span>
                                <strong>{pesos(datos.total)}</strong>
                                <small>{mes ? meses[Number(mes) - 1] : 'Todo el año'} · {anio}</small>
                            </article>
                            <article>
                                <HeartHandshake />
                                <span>Donaciones confirmadas</span>
                                <strong>{datos.cantidad}</strong>
                                <small>{datos.totalPendientes || 0} pendiente(s) por verificar</small>
                            </article>
                            <article>
                                <Users />
                                <span>Padrinos vigentes</span>
                                <strong>{datos.padrinosVigentes}</strong>
                                <small>Personas con apadrinamientos activos hoy</small>
                            </article>
                            <article>
                                <CalendarDays />
                                <span>Aporte mensual vigente</span>
                                <strong>{pesos(datos.aporteMensualVigente)}</strong>
                                <small>Comprometido en suscripciones activas</small>
                            </article>
                        </div>

                        <section className="donaciones-bloque">
                            <div className="donaciones-tabs">
                                <button type="button" aria-pressed={tab === 'pendientes'} onClick={() => setTab('pendientes')}>
                                    Pendientes por verificar ({datos.pendientes?.length || 0})
                                </button>
                                <button type="button" aria-pressed={tab === 'historial'} onClick={() => setTab('historial')}>
                                    Historial confirmado ({datos.donaciones?.length || 0})
                                </button>
                                <button type="button" aria-pressed={tab === 'padrinos'} onClick={() => setTab('padrinos')}>
                                    Padrinos y suscripciones ({datos.suscripciones?.length || 0})
                                </button>
                            </div>

                            {tab === 'pendientes' ? (
                                <>
                                    <div className="eventos-cabecera">
                                        <p className="descripcion-seccion">
                                            Solicitudes en espera de transferencia o entrega de insumos en el refugio. Si no se confirman en 48 horas se eliminan automáticamente.
                                        </p>
                                    </div>
                                    {!datos.pendientes || datos.pendientes.length === 0 ? (
                                        <p className="estado-pagina">No hay donaciones pendientes por verificar.</p>
                                    ) : (
                                        <div className="eventos-tabla-scroll" tabIndex={0} role="region" aria-label="Donaciones pendientes">
                                            <table className="eventos-tabla">
                                                <thead>
                                                    <tr>
                                                        <th>Asunto / N°</th>
                                                        <th>Registrada / Vence</th>
                                                        <th>Usuario Donante</th>
                                                        <th>Aporte</th>
                                                        <th>Destino / Detalle</th>
                                                        <th>Estado</th>
                                                        {esAdmin && <th>Acciones</th>}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {datos.pendientes.map((item) => (
                                                        <tr key={item.donacionId}>
                                                            <td>
                                                                <strong>Donación #{item.donacionId}</strong>
                                                            </td>
                                                            <td>
                                                                {fecha(item.fechaTransaccion)}
                                                                <span>Expira: {fecha(item.venceEn)}</span>
                                                            </td>
                                                            <td>
                                                                <strong>{item.nombreDonante}</strong>
                                                                <span>{item.correoDonante}{item.rutDonante ? ` · ${item.rutDonante}` : ''}</span>
                                                            </td>
                                                            <td>
                                                                {item.categoriaDonacion === 'Insumo' ? (
                                                                    <>
                                                                        <strong>Insumos</strong>
                                                                        <span>Entrega presencial</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <strong>{pesos(item.monto)}</strong>
                                                                        <span>{item.modalidad}</span>
                                                                    </>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {item.categoriaDonacion === 'Insumo'
                                                                    ? item.detalleInsumo
                                                                    : item.animal
                                                                        ? `Apadrinar a ${item.animal}`
                                                                        : 'Refugio'}
                                                            </td>
                                                            <td>
                                                                <span className="reporte-estado">{item.estado}</span>
                                                            </td>
                                                            {esAdmin && (
                                                                <td>
                                                                    <div className="gestion-acciones">
                                                                        <button
                                                                            type="button"
                                                                            className="boton boton-verde"
                                                                            disabled={bloqueado}
                                                                            onClick={() => aprobarDonacion(item)}
                                                                        >
                                                                            <CheckCircle2 />Marcar completada
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            className="boton boton-secundario"
                                                                            disabled={bloqueado}
                                                                            onClick={() => descartarPendiente(item)}
                                                                        >
                                                                            <Trash2 />Descartar
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            )}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </>
                            ) : tab === 'historial' ? (
                                <>
                                    <div className="eventos-cabecera">
                                        <p className="descripcion-seccion">
                                            Ordenado desde la confirmación más reciente. Incluye transferencias e insumos verificados.
                                        </p>
                                        <button
                                            type="button"
                                            className="boton boton-secundario"
                                            disabled={bloqueado}
                                            onClick={() => exportar('donaciones')}
                                        >
                                            <Download />Descargar historial
                                        </button>
                                    </div>
                                    {datos.donaciones.length === 0 ? (
                                        <p className="estado-pagina">No hay donaciones confirmadas en este período.</p>
                                    ) : (
                                        <div className="eventos-tabla-scroll" tabIndex={0} role="region" aria-label="Historial de donaciones">
                                            <table className="eventos-tabla">
                                                <thead>
                                                    <tr>
                                                        <th>N°</th>
                                                        <th>Fecha confirmación</th>
                                                        <th>Usuario Donante</th>
                                                        <th>Aporte</th>
                                                        <th>Destino / Detalle</th>
                                                        <th>Estado</th>
                                                        <th>Comprobante</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {datos.donaciones.slice((pagina - 1) * 10, pagina * 10).map((item) => (
                                                        <tr key={item.donacionId}>
                                                            <td>#{item.donacionId}</td>
                                                            <td>{fecha(item.confirmadoEn)}</td>
                                                            <td>
                                                                <strong>{item.nombreDonante}</strong>
                                                                <span>{item.correoDonante}{item.rutDonante ? ` · ${item.rutDonante}` : ''}</span>
                                                            </td>
                                                            <td>
                                                                {item.categoriaDonacion === 'Insumo' ? (
                                                                    <>
                                                                        <strong>Insumos</strong>
                                                                        <span>Presencial</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <strong>{pesos(item.monto)}</strong>
                                                                        <span>{item.modalidad}</span>
                                                                    </>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {item.categoriaDonacion === 'Insumo'
                                                                    ? item.detalleInsumo
                                                                    : item.animal || 'Refugio'}
                                                            </td>
                                                            <td><span className="donacion-estado">{item.estado}</span></td>
                                                            <td>{item.reciboEstado}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                    {datos.donaciones.length > 10 && (
                                        <div className="donaciones-paginacion">
                                            <button
                                                type="button"
                                                className="boton boton-secundario"
                                                disabled={pagina === 1}
                                                onClick={() => setPagina((actual) => actual - 1)}
                                            >
                                                Anterior
                                            </button>
                                            <span>Página {pagina} de {Math.ceil(datos.donaciones.length / 10)}</span>
                                            <button
                                                type="button"
                                                className="boton boton-secundario"
                                                disabled={pagina * 10 >= datos.donaciones.length}
                                                onClick={() => setPagina((actual) => actual + 1)}
                                            >
                                                Siguiente
                                            </button>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <div className="eventos-cabecera">
                                        <p className="descripcion-seccion">
                                            Suscripciones activas a la fecha, independientes del período seleccionado.
                                        </p>
                                        <button
                                            type="button"
                                            className="boton boton-secundario"
                                            disabled={bloqueado}
                                            onClick={() => exportar('padrinos')}
                                        >
                                            <Download />Descargar padrinos
                                        </button>
                                    </div>
                                    {datos.suscripciones.length === 0 ? (
                                        <p className="estado-pagina">No hay suscripciones vigentes.</p>
                                    ) : (
                                        <div className="eventos-tabla-scroll" tabIndex={0} role="region" aria-label="Suscripciones vigentes">
                                            <table className="eventos-tabla">
                                                <thead>
                                                    <tr>
                                                        <th>Padrino / socio</th>
                                                        <th>Animal / destino</th>
                                                        <th>Aporte mensual</th>
                                                        <th>Desde</th>
                                                        <th>Estado</th>
                                                        {esAdmin && <th>Acciones</th>}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {datos.suscripciones.map((item) => (
                                                        <tr key={item.suscripcionId}>
                                                            <td>
                                                                <strong>{item.nombreDonante}</strong>
                                                                <span>{item.correoDonante}{item.rutDonante ? ` · ${item.rutDonante}` : ''}</span>
                                                            </td>
                                                            <td>{item.animal || 'Apoyo general al refugio'}</td>
                                                            <td>{pesos(item.monto)}</td>
                                                            <td>{fecha(item.creadoEn)}</td>
                                                            <td><span className="donacion-estado">{item.estado}</span></td>
                                                            {esAdmin && (
                                                                <td>
                                                                    <button
                                                                        type="button"
                                                                        className="boton boton-secundario"
                                                                        disabled={bloqueado}
                                                                        onClick={() => {
                                                                            setSeleccionada(item);
                                                                            setMotivo('');
                                                                            setError('');
                                                                        }}
                                                                    >
                                                                        Desactivar
                                                                    </button>
                                                                </td>
                                                            )}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </>
                            )}
                        </section>

                        <section className="donaciones-bloque">
                            <div className="eventos-cabecera">
                                <div>
                                    <h2 className="gestion-subtitulo">Recaudación económica por mes</h2>
                                    <p className="descripcion-seccion">Aportes en dinero efectivamente confirmados, únicos y mensuales.</p>
                                </div>
                                <button type="button" className="boton boton-secundario" disabled={bloqueado} onClick={() => exportar('resumen')}>
                                    <Download />Descargar resumen
                                </button>
                            </div>
                            <div className="donaciones-meses">
                                {datos.resumen.map((item) => (
                                    <div key={item.mes}>
                                        <span>{meses[item.mes - 1]}</span>
                                        <strong>{pesos(item.total)}</strong>
                                        <small>{item.cantidad} aporte(s)</small>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </>
                )
            )}

            {seleccionada && (
                <Modal titulo="Desactivar suscripción" onClose={() => setSeleccionada(null)} bloqueado={ocupado}>
                    <form className="donacion-formulario" onSubmit={desactivar}>
                        <p>
                            Se detendrán los próximos cobros de <strong>{seleccionada.nombreDonante}</strong>
                            {seleccionada.animal ? ` para ${seleccionada.animal}` : ''}. Los aportes ya recibidos permanecerán en el historial.
                        </p>
                        <label>
                            Motivo
                            <textarea
                                value={motivo}
                                onChange={(event) => setMotivo(event.target.value)}
                                required
                                minLength={3}
                                maxLength={500}
                                rows={3}
                                disabled={ocupado}
                            />
                        </label>
                        {error && <p className="mensaje mensaje-error" role="alert">{error}</p>}
                        <div className="gestion-acciones">
                            <button type="submit" className="boton boton-primario" disabled={ocupado}>
                                {ocupado ? 'Desactivando…' : 'Confirmar desactivación'}
                            </button>
                            <button type="button" className="boton boton-secundario" disabled={ocupado} onClick={() => setSeleccionada(null)}>
                                Volver
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default DonacionGestion;



