import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, RefreshCw } from 'lucide-react';
import { descargarComprobante, formatearDetalleInsumo } from '../../services/donacion.service.js';
import Paginacion from '../Paginacion.jsx';

const ITEMS_POR_PAGINA = 10;
const pesos = (valor) => Number(valor || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
const formatearFecha = (valor) =>
    valor
        ? new Date(valor).toLocaleString('es-CL', {
              timeZone: 'America/Santiago',
              dateStyle: 'medium',
              timeStyle: 'short',
          })
        : '';

const HistorialDonacionesUsuario = ({ misAportes, cargando, onActualizar }) => {
    const [tab, setTab] = useState('confirmadas');
    const [pagina, setPagina] = useState(1);

    const cambiarTab = (nuevoTab) => {
        setTab(nuevoTab);
        setPagina(1);
    };

    const listaActual =
        tab === 'confirmadas'
            ? misAportes?.confirmadas || []
            : tab === 'pendientes'
                ? misAportes?.pendientes || []
                : misAportes?.suscripciones || [];

    const inicio = (pagina - 1) * ITEMS_POR_PAGINA;
    const visibles = listaActual.slice(inicio, inicio + ITEMS_POR_PAGINA);

    return (
        <section className="donaciones-bloque" id="mis-donaciones" aria-labelledby="titulo-mis-donaciones">
            <div className="eventos-cabecera">
                <div>
                    <h2 id="titulo-mis-donaciones" className="gestion-subtitulo">Mis donaciones y comprobantes</h2>
                    <p className="descripcion-seccion">
                        Revisa el estado de tus aportes y descarga tus comprobantes cuando hayan sido verificados por el refugio.
                    </p>
                </div>
                <button type="button" className="boton boton-secundario" onClick={onActualizar} disabled={cargando}>
                    <RefreshCw />Actualizar
                </button>
            </div>

            <div className="donaciones-tabs" style={{ marginTop: '1rem' }}>
                <button type="button" aria-pressed={tab === 'confirmadas'} onClick={() => cambiarTab('confirmadas')}>
                    Historial confirmado ({misAportes?.confirmadas?.length || 0})
                </button>
                <button type="button" aria-pressed={tab === 'pendientes'} onClick={() => cambiarTab('pendientes')}>
                    Pendientes por verificar ({misAportes?.pendientes?.length || 0})
                </button>
                <button type="button" aria-pressed={tab === 'apadrinamientos'} onClick={() => cambiarTab('apadrinamientos')}>
                    Mis apadrinamientos ({misAportes?.suscripciones?.length || 0})
                </button>
            </div>

            {cargando ? (
                <p className="estado-pagina" role="status">Cargando tus donaciones…</p>
            ) : visibles.length === 0 ? (
                <p className="estado-pagina">No hay registros en esta pestaña.</p>
            ) : (
                <>
                    <div className="eventos-tabla-scroll" tabIndex={0}>
                        {tab === 'confirmadas' && (
                            <table className="eventos-tabla">
                                <thead>
                                    <tr>
                                        <th>N°</th><th>Fecha confirmación</th><th>Aporte</th><th>Destino / Detalle</th><th>Estado</th><th>Comprobante</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibles.map((item) => (
                                        <tr key={item.donacionId}>
                                            <td><strong>Donación #{item.donacionId}</strong></td>
                                            <td>{formatearFecha(item.confirmadoEn || item.fechaTransaccion)}</td>
                                            <td>
                                                {item.categoriaDonacion === 'Insumo'
                                                    ? <><strong>Insumos</strong><span>Entrega presencial</span></>
                                                    : <><strong>{pesos(item.monto)}</strong><span>{item.modalidad}</span></>}
                                            </td>
                                            <td>{item.categoriaDonacion === 'Insumo' ? formatearDetalleInsumo(item.detalleInsumo) : item.animal ? `Apadrinamiento de ${item.animal}` : 'Refugio'}</td>
                                            <td><span className="donacion-estado">{item.estado}</span></td>
                                            <td>
                                                <div className="gestion-acciones">
                                                    <button type="button" className="boton boton-verde" onClick={() => descargarComprobante(item)}>
                                                        <Download />Descargar (.pdf)
                                                    </button>
                                                    <Link className="boton boton-secundario" to={`/donaciones/resultado?id=${item.donacionId}`}>Ver detalle</Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {tab === 'pendientes' && (
                            <table className="eventos-tabla">
                                <thead>
                                    <tr>
                                        <th>Asunto / N°</th><th>Registrada / Vence</th><th>Aporte</th><th>Destino / Detalle</th><th>Estado</th><th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibles.map((item) => (
                                        <tr key={item.donacionId}>
                                            <td><strong>Donación #{item.donacionId}</strong></td>
                                            <td>{formatearFecha(item.fechaTransaccion)}<span>Expira: {formatearFecha(item.venceEn)}</span></td>
                                            <td>
                                                {item.categoriaDonacion === 'Insumo'
                                                    ? <><strong>Insumos</strong><span>Entrega presencial</span></>
                                                    : <><strong>{pesos(item.monto)}</strong><span>{item.modalidad}</span></>}
                                            </td>
                                            <td>{item.categoriaDonacion === 'Insumo' ? formatearDetalleInsumo(item.detalleInsumo) : item.animal ? `Apadrinar a ${item.animal}` : 'Refugio'}</td>
                                            <td><span className="reporte-estado">{item.estado}</span></td>
                                            <td>
                                                <Link className="boton boton-primario" to={`/donaciones/resultado?id=${item.donacionId}`}>Ver instrucciones</Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {tab === 'apadrinamientos' && (
                            <table className="eventos-tabla">
                                <thead>
                                    <tr><th>Destino / Mascota</th><th>Aporte mensual</th><th>Activo desde</th><th>Estado</th></tr>
                                </thead>
                                <tbody>
                                    {visibles.map((item) => (
                                        <tr key={item.suscripcionId}>
                                            <td><strong>{item.animal || 'Apoyo general al refugio'}</strong></td>
                                            <td>{pesos(item.monto)}</td>
                                            <td>{formatearFecha(item.creadoEn)}</td>
                                            <td><span className="donacion-estado">{item.estado}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <Paginacion
                        paginaActual={pagina}
                        totalItems={listaActual.length}
                        itemsPorPagina={ITEMS_POR_PAGINA}
                        onCambiarPagina={setPagina}
                    />
                </>
            )}
        </section>
    );
};

export default HistorialDonacionesUsuario;
