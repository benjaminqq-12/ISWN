import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { HeartHandshake, PawPrint } from 'lucide-react';
import DonacionFormulario from '../components/donaciones/donacionFormulario.jsx';
import DonacionGestion from '../components/donaciones/donacionGestion.jsx';
import { getAnimalesApadrinables, iniciarAporte } from '../services/donacion.service.js';
import '../styles/eventos.css';
import '../styles/donaciones.css';

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
        animalId: animalInicial,
        aceptaMensual: false,
    });
    const [apadrinar, setApadrinar] = useState(Boolean(animalInicial));
    const [animales, setAnimales] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [errorCarga, setErrorCarga] = useState('');
    const [error, setError] = useState('');
    const [enviando, setEnviando] = useState(false);

    const cargarAnimales = async () => {
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
    };

    useEffect(() => {
        cargarAnimales();
    }, []);

    const manejarCambio = (event) => {
        const { name, type, checked, value } = event.target;
        setDatos((actual) => ({
            ...actual,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const manejarCategoria = (categoriaDonacion) => {
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
        setDatos((actual) => ({ ...actual, modalidad, aceptaMensual: false }));
        if (modalidad === 'Unica') {
            setApadrinar(false);
        }
    };

    const manejarMonto = (monto) => {
        setDatos((actual) => ({ ...actual, monto }));
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
                setError('Especifica qué insumos (alimento, medicinas, mantas, etc.) vas a donar.');
                return;
            }
        } else {
            if (!Number.isInteger(Number(datos.monto)) || Number(datos.monto) <= 2000) {
                setError('El aporte económico debe ser un número entero estrictamente mayor a $2.000.');
                return;
            }
            if (apadrinar && !animales.some((animal) => String(animal.mascota_id) === String(datos.animalId))) {
                setError('Selecciona un animal que se encuentre En Refugio.');
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
                animalId: !esInsumo && apadrinar ? Number(datos.animalId) : null,
                ...(datos.modalidad === 'Mensual' && !esInsumo ? { aceptaMensual: datos.aceptaMensual } : {}),
            });

            if (respuesta?.status !== 'Success') {
                setError(typeof respuesta?.details === 'string' ? respuesta.details : respuesta?.message || 'No se pudo registrar la donación.');
                return;
            }

            navigate(`/donaciones/resultado?id=${encodeURIComponent(respuesta.data.donacionId)}`);
        } finally {
            setEnviando(false);
        }
    };

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
                    <p className="evento-info">
                        Donando con tu cuenta: <strong>{session.user.usuarioNombre}</strong> ({session.user.usuarioEmail})
                    </p>
                </div>
            ) : (
                <div className="eventos-selector">
                    <p className="evento-info">
                        Puedes revisar las modalidades de ayuda libremente. Para registrar una donación necesitas iniciar sesión.
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
                        enviando={enviando}
                        error={error}
                        onCambiar={manejarCambio}
                        onCambiarCategoria={manejarCategoria}
                        onCambiarModalidad={manejarModalidad}
                        onSeleccionarMonto={manejarMonto}
                        onCambiarApadrinar={setApadrinar}
                        onSubmit={manejarEnvio}
                    />
                )}
            </section>
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
