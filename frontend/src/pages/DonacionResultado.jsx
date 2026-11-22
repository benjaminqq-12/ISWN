import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Download, RefreshCw } from 'lucide-react';
import { getEstadoAporte } from '../services/donacion.service.js';
import '../styles/eventos.css';
import '../styles/donaciones.css';

const DonacionResultado = () => {
    const [parametros] = useSearchParams();
    const donacionId = parametros.get('id');
    const [datos, setDatos] = useState(null);
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(true);

    const consultar = useCallback(async () => {
        setCargando(true);
        const respuesta = await getEstadoAporte(donacionId || '');
        if (respuesta.status === 'Success') {
            setDatos(respuesta.data);
            setError('');
        } else {
            setError(respuesta.message || 'No se pudo consultar el aporte.');
        }
        setCargando(false);
    }, [donacionId]);

    useEffect(() => {
        consultar();
    }, [consultar]);

    const esInsumo = datos?.categoriaDonacion === 'Insumo';

    const descargarComprobante = () => {
        if (!datos) return;
        const montoFormateado = Number(datos.monto).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
        const fechaFormateada = datos.fecha
            ? new Date(datos.fecha).toLocaleString('es-CL', { timeZone: 'America/Santiago' })
            : new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' });

        const lineas = [
            '====================================================',
            '      COMPROBANTE DE APORTE - HOGAR DE MASCOTAS     ',
            '====================================================',
            `N° de Donación : #${datos.donacionId}`,
            `Fecha (Chile)  : ${fechaFormateada}`,
            `Donante        : ${datos.nombreDonante || 'Usuario'}`,
            ...(datos.rutDonante ? [`RUT            : ${datos.rutDonante}`] : []),
            `Correo         : ${datos.correoDonante || 'No especificado'}`,
            `Categoría      : ${esInsumo ? 'Donación de Insumos' : 'Aporte Económico'}`,
            ...(esInsumo
                ? [`Detalle Insumos: ${datos.detalleInsumo}`]
                : [
                    `Modalidad      : ${datos.modalidad === 'Mensual' ? 'Suscripción mensual' : 'Donación única'}`,
                    `Destino        : ${datos.animal ? `Apadrinamiento de ${datos.animal}` : 'Fondo general del refugio'}`,
                    `Monto          : ${montoFormateado} CLP`,
                ]),
            `Estado         : ${datos.estado}`,
            '----------------------------------------------------',
            'Gracias por apoyar el cuidado y bienestar de nuestros',
            'animales rescatados.',
            '====================================================',
        ];

        const blob = new Blob([lineas.join('\r\n')], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `comprobante-donacion-${datos.donacionId}.txt`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const confirmado = ['Completado', 'Activo'].includes(datos?.estado);

    return (
        <div className="donaciones-contenedor donacion-resultado">
            <section className="donaciones-bloque">
                <p className="donaciones-etiqueta">Tu aporte al refugio</p>
                <h1 className="titulo-seccion">
                    {confirmado ? '¡Aporte verificado y confirmado!' : 'Instrucciones para completar tu donación'}
                </h1>

                {cargando ? (
                    <p className="evento-info" role="status">Consultando el aporte…</p>
                ) : error ? (
                    <p className="mensaje mensaje-error" role="alert">{error}</p>
                ) : (
                    datos && (
                        <>
                            <p className="evento-info">
                                Solicitud N° <strong>#{datos.donacionId}</strong> · Estado:{' '}
                                <strong>{datos.estado}</strong> · Tipo:{' '}
                                <strong>
                                    {esInsumo
                                        ? 'Donación de Insumos'
                                        : `${Number(datos.monto).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })} (${datos.modalidad === 'Mensual' ? 'Suscripción mensual' : 'Aporte único'})`}
                                </strong>
                            </p>
                            {esInsumo && datos.detalleInsumo && (
                                <p className="evento-info">
                                    Insumos registrados: <strong>{datos.detalleInsumo}</strong>
                                </p>
                            )}
                            {!esInsumo && datos.animal && (
                                <p className="evento-info">
                                    Mascota a apadrinar: <strong>{datos.animal}</strong>
                                </p>
                            )}
                            <p className="evento-info">
                                Donante: {datos.nombreDonante} ({datos.correoDonante}{datos.rutDonante ? ` · RUT ${datos.rutDonante}` : ''})
                            </p>

                            {confirmado ? (
                                <div className="mensaje mensaje-exito" role="status">
                                    <p>
                                        El administrador ya verificó tu aporte. Muchas gracias por tu colaboración con el refugio; ya puedes descargar tu comprobante.
                                    </p>
                                </div>
                            ) : esInsumo ? (
                                <div className="reporte-contexto" style={{ marginTop: '1rem' }}>
                                    <h3>Instrucciones para entregar tus insumos en el refugio</h3>
                                    <p>
                                        Acércate a nuestro refugio para hacer entrega de los insumos registrados indicando tu código de donación:
                                    </p>
                                    <p><strong>Código de entrega:</strong> <code>Donación #{datos.donacionId}</code></p>
                                    <p><strong>Dirección de recepción:</strong> Sede Hogar de Mascotas, Región del Biobío</p>
                                    <p><strong>Horario de recepción:</strong> Lunes a Sábado de 10:00 a 18:00 hrs.</p>
                                    {datos.venceEn && (
                                        <p>
                                            <strong>Plazo máximo de recepción:</strong>{' '}
                                            {new Date(datos.venceEn).toLocaleString('es-CL', {
                                                timeZone: 'America/Santiago',
                                                dateStyle: 'medium',
                                                timeStyle: 'short',
                                            })}{' '}
                                            (48 horas; si no se confirma la entrega dentro de ese plazo, la solicitud se elimina automáticamente).
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="reporte-contexto" style={{ marginTop: '1rem' }}>
                                    <h3>Datos bancarios para realizar tu transferencia</h3>
                                    <p>
                                        Realiza la transferencia desde tu aplicación bancaria con los siguientes datos e indica el número de tu donación en el comentario:
                                    </p>
                                    <p><strong>Banco:</strong> Banco Estado</p>
                                    <p><strong>Tipo de cuenta:</strong> Cuenta Corriente / Cuenta RUT</p>
                                    <p><strong>N° de cuenta:</strong> 4150-009823-1</p>
                                    <p><strong>RUT:</strong> 65.142.890-K (Fundación Hogar de Mascotas)</p>
                                    <p><strong>Correo de notificación:</strong> donaciones@hogardemascotas.cl</p>
                                    <p>
                                        <strong>Asunto / Comentario obligatorio:</strong> <code>Donación #{datos.donacionId}</code>
                                    </p>
                                    {datos.venceEn && (
                                        <p>
                                            <strong>Plazo máximo para transferir:</strong>{' '}
                                            {new Date(datos.venceEn).toLocaleString('es-CL', {
                                                timeZone: 'America/Santiago',
                                                dateStyle: 'medium',
                                                timeStyle: 'short',
                                            })}{' '}
                                            (48 horas; si no se confirma dentro de ese plazo, la solicitud se elimina automáticamente).
                                        </p>
                                    )}
                                </div>
                            )}
                        </>
                    )
                )}

                <div className="evento-acciones">
                    {datos && confirmado && (
                        <button type="button" className="boton boton-verde" onClick={descargarComprobante}>
                            <Download />Descargar comprobante (.txt)
                        </button>
                    )}
                    <button type="button" className="boton boton-secundario" disabled={cargando} onClick={consultar}>
                        <RefreshCw />Verificar si ya fue confirmada
                    </button>
                    <Link className="boton boton-primario" to="/donaciones">
                        Volver a Donaciones
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default DonacionResultado;



