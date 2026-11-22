import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

const CATEGORIAS_INSUMOS = [
    {
        id: 'comida',
        etiqueta: 'Comida de animales',
        esComida: true,
        unidadFija: 'kg',
        placeholder: 'Ej: Alimento seco adulto, marca Master Dog...',
    },
    {
        id: 'medicamentos',
        etiqueta: 'Medicamentos',
        esComida: false,
        unidades: ['unidades', 'paquetes', 'litros'],
        placeholder: 'Ej: Antiparasitario interno, gasas, suero...',
    },
    {
        id: 'limpieza',
        etiqueta: 'Insumos de limpieza',
        esComida: false,
        unidades: ['unidades', 'litros', 'paquetes'],
        placeholder: 'Ej: Cloro, desinfectante, bolsas de basura...',
    },
];

const DonacionFormulario = ({
    datos,
    apadrinar,
    animales,
    animalesApadrinadosIds = [],
    animalesPendientesIds = [],
    enviando,
    error,
    onCambiar,
    onCambiarCategoria,
    onCambiarModalidad,
    onSeleccionarMonto,
    onCambiarApadrinar,
    onToggleAnimal,
    onCambiarDetalleInsumo,
    onSubmit,
}) => {
    const esInsumo = datos.categoriaDonacion === 'Insumo';
    const [seleccionInsumos, setSeleccionInsumos] = useState({});

    const sincronizarDetalle = (nuevoMapa) => {
        const texto = Object.entries(nuevoMapa)
            .map(([catId, info]) => {
                const cant = Math.max(1, Number(info.cantidad) || 1);
                const desc = (info.descripcion || '').trim();
                if (catId === 'comida') {
                    const kg = Math.max(1, Number(info.kg) || 1);
                    const totalKg = cant * kg;
                    const destino = info.subcategoria || 'perros';
                    return `comida|${destino}|${totalKg}|kg|${desc || `${cant}x${kg}kg`}`;
                }
                const unidad = info.unidad || 'unidades';
                return `${catId}|general|${cant}|${unidad}|${desc || catId}`;
            })
            .join(' ; ');
        onCambiarDetalleInsumo(texto);
    };

    const toggleCategoriaInsumo = (catId) => {
        const copia = { ...seleccionInsumos };
        if (copia[catId]) {
            delete copia[catId];
        } else {
            copia[catId] =
                catId === 'comida'
                    ? { subcategoria: 'perros', cantidad: 1, kg: 1, descripcion: '' }
                    : { unidad: 'unidades', cantidad: 1, descripcion: '' };
        }
        setSeleccionInsumos(copia);
        sincronizarDetalle(copia);
    };
    const actualizarInsumo = (catId, campo, valor) => {
        const copia = {
            ...seleccionInsumos,
            [catId]: { ...seleccionInsumos[catId], [campo]: valor },
        };
        setSeleccionInsumos(copia);
        sincronizarDetalle(copia);
    };

    const cantidadAnimales = apadrinar ? (datos.animalIds?.length || 0) : 0;
    const montoUnitario = Number(datos.monto || 0);
    const totalMensual = cantidadAnimales > 1 ? montoUnitario * cantidadAnimales : montoUnitario;
    const categoriasMarcadas = CATEGORIAS_INSUMOS.filter((c) => Boolean(seleccionInsumos[c.id]));

    return (
        <form className="donacion-formulario" onSubmit={onSubmit}>
            <fieldset disabled={enviando}>
                <legend>Tipo de donación</legend>
                <div className="donaciones-opciones" aria-label="Categoría de donación">
                    {[
                        ['Dinero', 'Aporte en dinero (Transferencia)'],
                        ['Insumo', 'Donación de insumos (Alimento, medicinas, otros)'],
                    ].map(([valor, texto]) => (
                        <button
                            type="button"
                            key={valor}
                            aria-pressed={datos.categoriaDonacion === valor}
                            onClick={() => onCambiarCategoria(valor)}
                        >
                            {texto}
                        </button>
                    ))}
                </div>

                {esInsumo ? (
                    <div className="donaciones-bloque-insumos">
                        <p className="descripcion-seccion">
                            Marca los tipos de insumos que vas a entregar y luego indica la cantidad y el detalle abajo:
                        </p>

                        <div className="donaciones-dos-columnas">
                            {CATEGORIAS_INSUMOS.map((cat) => {
                                const marcado = Boolean(seleccionInsumos[cat.id]);
                                return (
                                    <label
                                        key={cat.id}
                                        className={`donaciones-casilla ${marcado ? 'insumo-marcado' : ''}`}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={marcado}
                                            onChange={() => toggleCategoriaInsumo(cat.id)}
                                        />
                                        <span>{cat.etiqueta}</span>
                                    </label>
                                );
                            })}
                        </div>

                        {categoriasMarcadas.length > 0 && (
                            <div className="donaciones-detalles-insumos">
                                {categoriasMarcadas.map((cat) => {
                                    const info = seleccionInsumos[cat.id];
                                    return (
                                        <div key={cat.id} className="donacion-detalle-fila">
                                            {cat.esComida ? (
                                                <>
                                                    <label style={{ width: '130px' }}>
                                                        Destinado a
                                                        <select
                                                            value={info.subcategoria}
                                                            onChange={(e) => actualizarInsumo(cat.id, 'subcategoria', e.target.value)}
                                                        >
                                                            <option value="perros">Perros</option>
                                                            <option value="gatos">Gatos</option>
                                                        </select>
                                                    </label>
                                                    <label style={{ width: '95px' }}>
                                                        Cantidad
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            max={999}
                                                            value={info.cantidad}
                                                            onChange={(e) => actualizarInsumo(cat.id, 'cantidad', e.target.value)}
                                                            required
                                                        />
                                                    </label>
                                                    <label style={{ width: '105px' }}>
                                                        Kg c/u (kg)
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            max={500}
                                                            value={info.kg}
                                                            onChange={(e) => actualizarInsumo(cat.id, 'kg', e.target.value)}
                                                            required
                                                        />
                                                    </label>
                                                    <label style={{ flex: 1, minWidth: '180px' }}>
                                                        Detalle ({(Number(info.cantidad) || 1) * (Number(info.kg) || 1)} kg total)
                                                        <input
                                                            type="text"
                                                            maxLength={250}
                                                            value={info.descripcion}
                                                            onChange={(e) => actualizarInsumo(cat.id, 'descripcion', e.target.value)}
                                                            placeholder={cat.placeholder}
                                                            required
                                                        />
                                                    </label>
                                                </>
                                            ) : (
                                                <>
                                                    <label style={{ width: '95px' }}>
                                                        Cantidad
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            max={999}
                                                            value={info.cantidad}
                                                            onChange={(e) => actualizarInsumo(cat.id, 'cantidad', e.target.value)}
                                                            required
                                                        />
                                                    </label>
                                                    <label style={{ width: '125px' }}>
                                                        Unidad
                                                        <select
                                                            value={info.unidad}
                                                            onChange={(e) => actualizarInsumo(cat.id, 'unidad', e.target.value)}
                                                        >
                                                            {cat.unidades.map((u) => (
                                                                <option key={u} value={u}>{u}</option>
                                                            ))}
                                                        </select>
                                                    </label>
                                                    <label style={{ flex: 1, minWidth: '180px' }}>
                                                        Detalle de {cat.etiqueta}
                                                        <input
                                                            type="text"
                                                            maxLength={250}
                                                            value={info.descripcion}
                                                            onChange={(e) => actualizarInsumo(cat.id, 'descripcion', e.target.value)}
                                                            placeholder={cat.placeholder}
                                                            required
                                                        />
                                                    </label>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="donaciones-opciones" aria-label="Frecuencia del aporte">
                            {[
                                ['Unica', 'Donación única'],
                                ['Mensual', 'Donación mensual / Apadrinar'],
                            ].map(([valor, texto]) => (
                                <button
                                    type="button"
                                    key={valor}
                                    aria-pressed={datos.modalidad === valor}
                                    onClick={() => onCambiarModalidad(valor)}
                                >
                                    {texto}
                                </button>
                            ))}
                        </div>

                        <div className="donaciones-montos">
                            {[5000, 10000, 25000, 50000].map((monto) => (
                                <button
                                    type="button"
                                    key={monto}
                                    aria-pressed={Number(datos.monto) === monto}
                                    onClick={() => onSeleccionarMonto(monto)}
                                >
                                    {monto.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}
                                </button>
                            ))}
                        </div>

                        <label>
                            Otro monto en pesos chilenos {cantidadAnimales > 1 ? '(por cada animal)' : ''}
                            <input
                                name="monto"
                                type="number"
                                value={datos.monto}
                                onChange={onCambiar}
                                min={2001}
                                max={2147483647}
                                step={1}
                                required
                            />
                        </label>
                        <p className="descripcion-seccion">El monto debe ser estrictamente mayor a $2.000.</p>
                    </>
                )}
            </fieldset>

            {!esInsumo && datos.modalidad === 'Mensual' && (
                <fieldset disabled={enviando}>
                    <legend>¿Quieres apadrinar a uno o más animales?</legend>
                    <label className="donaciones-casilla">
                        <input
                            type="checkbox"
                            checked={apadrinar}
                            onChange={(event) => onCambiarApadrinar(event.target.checked)}
                        />
                        Dedicar mi aporte mensual a uno o más animales del refugio
                    </label>

                    {apadrinar && (
                        <>
                            <p className="descripcion-seccion">
                                Puedes seleccionar más de un animal desde la galería. Solo aparecen animales en estado En Refugio.
                            </p>
                            {animales.length === 0 ? (
                                <p className="evento-info">No hay animales disponibles para apadrinar en este momento.</p>
                            ) : (
                                <div className="donaciones-galeria">
                                    {animales.map((animal) => {
                                        const yaEsPadrino = animalesApadrinadosIds.includes(animal.mascota_id);
                                        const estaPendiente = animalesPendientesIds.includes(animal.mascota_id);
                                        const bloqueado = yaEsPadrino || estaPendiente;
                                        const seleccionado = (datos.animalIds || []).includes(animal.mascota_id);

                                        return (
                                            <label
                                                key={animal.mascota_id}
                                                className={`donacion-animal ${seleccionado ? 'seleccionado' : ''} ${bloqueado ? 'ya-apadrinado' : ''}`}
                                            >
                                                <img
                                                    src={animal.mascota_fotoURL || '/placeholder-mascota.svg'}
                                                    alt={animal.mascota_nombreCompleto}
                                                    onError={(event) => {
                                                        event.currentTarget.onerror = null;
                                                        event.currentTarget.src = '/placeholder-mascota.svg';
                                                    }}
                                                />
                                                <span>
                                                    <input
                                                        type="checkbox"
                                                        checked={seleccionado}
                                                        disabled={bloqueado}
                                                        onChange={() => onToggleAnimal(animal.mascota_id)}
                                                    />
                                                    {animal.mascota_nombreCompleto}
                                                </span>
                                                <small>{animal.mascota_especie} · En Refugio</small>
                                                {yaEsPadrino && <small className="donacion-aviso-padrino">Ya eres padrino</small>}
                                                {!yaEsPadrino && estaPendiente && <small className="donacion-aviso-padrino">Pendiente</small>}
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}

                    <label className="donaciones-casilla">
                        <input
                            type="checkbox"
                            name="aceptaMensual"
                            checked={datos.aceptaMensual}
                            onChange={onCambiar}
                            required
                        />
                        {cantidadAnimales > 1
                            ? `Autorizo un aporte mensual de ${montoUnitario.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })} por cada animal seleccionado (${cantidadAnimales} animales · Total: ${totalMensual.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}/mes).`
                            : `Autorizo un aporte mensual de ${montoUnitario.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}. Puedo solicitar su desactivación al refugio cuando lo necesite.`}
                    </label>
                </fieldset>
            )}

            <label>
                Mensaje opcional
                <textarea
                    name="mensaje"
                    value={datos.mensaje}
                    onChange={onCambiar}
                    maxLength={2000}
                    rows={3}
                    disabled={enviando}
                    placeholder="Deja un mensaje de apoyo para el refugio"
                />
            </label>

            {error && <p className="mensaje mensaje-error" role="alert">{error}</p>}

            <button type="submit" className="boton boton-primario donacion-pagar" disabled={enviando}>
                {enviando
                    ? 'Registrando solicitud…'
                    : esInsumo
                        ? 'Registrar donación de insumos'
                        : datos.modalidad === 'Mensual'
                            ? 'Registrar suscripción y ver datos de transferencia'
                            : 'Registrar donación y ver datos de transferencia'}
            </button>
            <p className="donacion-seguridad">
                <ShieldCheck />Las solicitudes de donación no concretadas en un plazo de 48 horas se eliminan automáticamente.
            </p>
        </form>
    );
};

export default DonacionFormulario;
