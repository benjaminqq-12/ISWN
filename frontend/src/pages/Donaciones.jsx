import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { Download, HeartHandshake, PawPrint } from 'lucide-react';
import DonacionFormulario from '../components/donaciones/donacionFormulario.jsx';
import DonacionGestion from '../components/donaciones/donacionGestion.jsx';
import HistorialDonacionesUsuario from '../components/donaciones/historialDonacionesUsuario.jsx';
import {
    getAnimalesApadrinables,
    getMisDonaciones,
    iniciarAporte,
    descargarComprobante,
    formatearDetalleInsumo
} from '../services/donacion.service.js';
import '../styles/eventos.css';
import '../styles/donaciones.css';

const pesos = (valor) => Number(valor || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });

const DonacionesContenido = ({ session, abrirLogin, esEquipo, onVolverGestion }) => {
    const navigate = useNavigate();
    const [parametros] = useSearchParams();
    const animalInicial = parametros.get('animal') || '';
    const autenticado = Boolean(session?.token);

    const [datos, setDatos] = useState({
        categoriaDonacion: 'Dinero',
        modalidad: animalInicial ? 'Mensual' : 'Unica',
        monto: 10000,
        detalleInsumo: '',
        mensaje: '',
        animalIds: animalInicial ? [Number(animalInicial)] : [],
        aceptaMensual: false,
    });
    const [apadrinar, setApadrinar] = useState(Boolean(animalInicial));
    const [animales, setAnimales] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState('');
    const [error, setError] = useState('');
    const [enviando, setEnviando] = useState(false);

    const [misAportes, setMisAportes] = useState(null);
    const [cargandoMisAportes, setCargandoMisAportes] = useState(false);

    const cargarAnimales = useCallback(async () => {
        setCargando(true);
        setErrorCarga('');
        try {
            const respuesta = await getAnimalesApadrinables();
            if (respuesta?.status === 'Success') {
                setAnimales(respuesta.data || []);
            } else {
                setErrorCarga(respuesta?.message || 'No se pudieron cargar las opciones para donar.');
            }
        } finally {
            setCargando(false);
        }
    }, []);

    const cargarMisAportes = useCallback(async () => {
        if (!autenticado) {
            setMisAportes(null);
            return;
        }
        setCargandoMisAportes(true);
        try {
            const respuesta = await getMisDonaciones();
            if (respuesta?.status === 'Success') {
                setMisAportes(respuesta.data);
            }
        } finally {
            setCargandoMisAportes(false);
        }
    }, [autenticado]);

    useEffect(() => {
        cargarAnimales();
    }, [cargarAnimales]);

    useEffect(() => {
        cargarMisAportes();
    }, [cargarMisAportes]);

    const manejarCambio = (event) => {
        const { name, type, checked, value } = event.target;
        setError('');
        setDatos((actual) => ({
            ...actual,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const manejarCategoria = (categoriaDonacion) => {
        setError('');
        setDatos((actual) => ({
            ...actual,
            categoriaDonacion,
            modalidad: categoriaDonacion === 'Insumo' ? 'Unica' : actual.modalidad,
            aceptaMensual: false,
        }));
        if (categoriaDonacion === 'Insumo') {
            setApadrinar(false);
        }
    };

    const manejarModalidad = (modalidad) => {
        setError('');
        setDatos((actual) => ({ ...actual, modalidad, aceptaMensual: false }));
        if (modalidad === 'Unica') {
            setApadrinar(false);
        }
    };

    const manejarMonto = (monto) => {
        setError('');
        setDatos((actual) => ({ ...actual, monto }));
    };

    const manejarToggleAnimal = (mascotaId) => {
        setError('');
        setDatos((actual) => {
            const existe = actual.animalIds.includes(mascotaId);
            return {
                ...actual,
                animalIds: existe
                    ? actual.animalIds.filter((id) => id !== mascotaId)
                    : [...actual.animalIds, mascotaId],
            };
        });
    };

    const manejarDetalleInsumo = (detalleInsumo) => {
        setError('');
        setDatos((actual) => ({ ...actual, detalleInsumo }));
    };

    const manejarEnvio = async (event) => {
        event.preventDefault();
        if (enviando) return;
        setError('');

        if (!autenticado) {
            setError('Debes iniciar sesión con tu cuenta para registrar una donación.');
            abrirLogin();
            return;
        }

        const esInsumo = datos.categoriaDonacion === 'Insumo';

        if (esInsumo) {
            if (!datos.detalleInsumo || datos.detalleInsumo.trim().length < 3) {
                setError('Marca al menos una categoría de insumo e indica la cantidad y el detalle.');
                return;
            }
        } else {
            if (!Number.isInteger(Number(datos.monto)) || Number(datos.monto) <= 2000) {
                setError('El aporte económico debe ser un número entero estrictamente mayor a $2.000.');
                return;
            }
            if (apadrinar && datos.animalIds.length === 0) {
                setError('Selecciona al menos un animal que se encuentre En Refugio.');
                return;
            }
        }

        setEnviando(true);
        try {
            const respuesta = await iniciarAporte({
                categoriaDonacion: datos.categoriaDonacion,
                modalidad: esInsumo ? 'Unica' : datos.modalidad,
                monto: esInsumo ? 0 : Number(datos.monto),
                detalleInsumo: esInsumo ? datos.detalleInsumo.trim() : null,
                mensaje: datos.mensaje,
                animalIds: !esInsumo && apadrinar ? datos.animalIds : [],
                ...(datos.modalidad === 'Mensual' && !esInsumo ? { aceptaMensual: datos.aceptaMensual } : {}),
            });

            if (respuesta?.status !== 'Success') {
                setError(
                    typeof respuesta?.details === 'string'
                        ? respuesta.details
                        : respuesta?.message || 'No se pudo registrar la donación.'
                );
                return;
            }

            navigate(`/donaciones/resultado?id=${encodeURIComponent(respuesta.data.donacionId)}`);
        } finally {
            setEnviando(false);
        }
    };

    const ultima = misAportes?.ultimaDonacion;
    const animalesApadrinadosIds = (misAportes?.suscripciones || []).map((item) => item.animalId).filter(Boolean);
    const animalesPendientesIds = (misAportes?.pendientes || [])
        .filter((item) => item.modalidad === 'Mensual' && item.animalId)
        .map((item) => item.animalId);

    return (
        <div className="donaciones-contenedor">
            {esEquipo && onVolverGestion && (
                <div className="eventos-selector">
                    <p className="evento-info">Estás viendo el formulario público de donaciones y apadrinamientos.</p>
                    <button type="button" className="boton boton-secundario" onClick={onVolverGestion}>
                        Volver al panel de recaudaciones
                    </button>
                </div>
            )}

            <section className="donaciones-hero" aria-labelledby="titulo-donaciones">
                <div>
                    <p className="donaciones-etiqueta">Apoya nuestra misión</p>
                    <h1 id="titulo-donaciones">
                        Tu generosidad transforma <span>sus vidas</span> para siempre
                    </h1>
                    <p>
                        Cada aporte en dinero o en insumos (alimento, medicinas, abrigo) ayuda a cuidar a los animales que esperan una familia.
                    </p>
                    <a className="boton boton-primario" href="#formulario-donacion">
                        <HeartHandshake />Donar ahora
                    </a>
                </div>
                <div className="donaciones-ilustracion">
                    <PawPrint aria-hidden="true" />
                    <strong>Una ayuda que se siente cada día</strong>
                    <span>Alimento · Salud · Cuidado</span>
                </div>
            </section>

            {autenticado ? (
                <div className="eventos-selector">
                    <div>
                        <p className="evento-info">
                            Donando con tu cuenta: <strong>{session.user.usuarioNombre}</strong> ({session.user.usuarioEmail})
                        </p>
                        {ultima && (
                            <p className="evento-info">
                                Tu última donación: <strong>Donación #{ultima.donacionId}</strong> ·{' '}
                                <strong>
                                    {ultima.categoriaDonacion === 'Insumo'
                                        ? `Insumos (${formatearDetalleInsumo(ultima.detalleInsumo)})`
                                        : pesos(ultima.monto)}
                                </strong>{' '}
                                · Estado: <strong>{ultima.estado}</strong>
                            </p>
                        )}
                    </div>
                    <div className="gestion-acciones">
                        {ultima?.estado === 'Completado' && (
                            <button
                                type="button"
                                className="boton boton-verde"
                                onClick={() => descargarComprobante(ultima)}
                            >
                                <Download />Descargar comprobante (#{ultima.donacionId})
                            </button>
                        )}
                        {ultima && (
                            <Link
                                className="boton boton-secundario"
                                to={`/donaciones/resultado?id=${ultima.donacionId}`}
                            >
                                {ultima.estado === 'Pendiente'
                                    ? `Ver instrucciones (#${ultima.donacionId})`
                                    : `Ver detalle (#${ultima.donacionId})`}
                            </Link>
                        )}
                        <a className="boton boton-secundario" href="#mis-donaciones">
                            Ver mi historial
                        </a>
                    </div>
                </div>
            ) : (
                <div className="eventos-selector">
                    <p className="evento-info">
                        Puedes revisar las modalidades de ayuda libremente. Para registrar una donación o ver tus comprobantes necesitas iniciar sesión.
                    </p>
                    <button type="button" className="boton boton-secundario" onClick={abrirLogin}>
                        Iniciar sesión
                    </button>
                </div>
            )}

            <section className="donaciones-bloque" id="formulario-donacion" aria-labelledby="titulo-formulario-donacion">
                <h2 id="titulo-formulario-donacion" className="gestion-subtitulo">Elige tu forma de ayudar</h2>
                <p className="descripcion-seccion">
                    Selecciona si deseas realizar un aporte económico o donar insumos para el refugio.
                </p>

                {cargando ? (
                    <p className="estado-pagina" role="status">Cargando opciones…</p>
                ) : errorCarga ? (
                    <div className="estado-pagina" role="alert">
                        <h3>No pudimos cargar las opciones</h3>
                        <p>{errorCarga}</p>
                        <button type="button" className="boton boton-primario" onClick={cargarAnimales}>
                            Reintentar
                        </button>
                    </div>
                ) : (
                    <DonacionFormulario
                        datos={datos}
                        apadrinar={apadrinar}
                        animales={animales}
                        animalesApadrinadosIds={animalesApadrinadosIds}
                        animalesPendientesIds={animalesPendientesIds}
                        enviando={enviando}
                        error={error}
                        onCambiar={manejarCambio}
                        onCambiarCategoria={manejarCategoria}
                        onCambiarModalidad={manejarModalidad}
                        onSeleccionarMonto={manejarMonto}
                        onCambiarApadrinar={(marcado) => {
                            setError('');
                            setApadrinar(marcado);
                        }}
                        onToggleAnimal={manejarToggleAnimal}
                        onCambiarDetalleInsumo={manejarDetalleInsumo}
                        onSubmit={manejarEnvio}
                    />
                )}
            </section>

            {autenticado && (
                <HistorialDonacionesUsuario
                    misAportes={misAportes}
                    cargando={cargandoMisAportes}
                    onActualizar={cargarMisAportes}
                />
            )}
        </div>
    );
};

const Donaciones = () => {
    const { session, abrirLogin } = useOutletContext();
    const [parametros] = useSearchParams();
    const vieneConAnimal = Boolean(parametros.get('animal'));
    const [verPublico, setVerPublico] = useState(vieneConAnimal);
    const esEquipo = Boolean(session?.token && ['Admin', 'Voluntario'].includes(session.user?.rol));

    if (esEquipo && !verPublico) {
        return (
            <div className="donaciones-contenedor">
                <DonacionGestion
                    key={session.token}
                    session={session}
                    onVerFormulario={() => setVerPublico(true)}
                />
            </div>
        );
    }

    return (
        <DonacionesContenido
            key={session?.token || 'publico'}
            session={session}
            abrirLogin={abrirLogin}
            esEquipo={esEquipo}
            onVolverGestion={() => setVerPublico(false)}
        />
    );
};

export default Donaciones;