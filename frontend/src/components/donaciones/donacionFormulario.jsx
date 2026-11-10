import { ShieldCheck } from 'lucide-react';

const DonacionFormulario = ({
    datos,
    apadrinar,
    animales,
    enviando,
    error,
    onCambiar,
    onCambiarCategoria,
    onCambiarModalidad,
    onSeleccionarMonto,
    onCambiarApadrinar,
    onSubmit,
}) => {
    const esInsumo = datos.categoriaDonacion === 'Insumo';

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
                    <label>
                        Detalle de los insumos a donar
                        <textarea
                            name="detalleInsumo"
                            value={datos.detalleInsumo}
                            onChange={onCambiar}
                            maxLength={2000}
                            minLength={3}
                            rows={3}
                            required
                            placeholder="Ej: 2 sacos de alimento de 15 kg para perro adulto, mantas térmicas, gasas y antiparasitarios..."
                        />
                    </label>
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
                            Otro monto en pesos chilenos
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
                    <legend>¿Quieres apadrinar a un animal?</legend>
                    <label className="donaciones-casilla">
                        <input
                            type="checkbox"
                            checked={apadrinar}
                            onChange={(event) => onCambiarApadrinar(event.target.checked)}
                        />
                        Dedicar mi aporte mensual a un animal del refugio
                    </label>

                    {apadrinar && (
                        <>
                            <p className="descripcion-seccion">
                                Selecciona desde la galería. Solo aparecen animales en estado En Refugio.
                            </p>
                            {animales.length === 0 ? (
                                <p className="evento-info">No hay animales disponibles para apadrinar en este momento.</p>
                            ) : (
                                <div className="donaciones-galeria">
                                    {animales.map((animal) => (
                                        <label
                                            key={animal.mascota_id}
                                            className={`donacion-animal ${
                                                String(datos.animalId) === String(animal.mascota_id) ? 'seleccionado' : ''
                                            }`}
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
                                                    type="radio"
                                                    name="animalId"
                                                    value={animal.mascota_id}
                                                    checked={String(datos.animalId) === String(animal.mascota_id)}
                                                    onChange={onCambiar}
                                                    required={apadrinar}
                                                />
                                                {animal.mascota_nombreCompleto}
                                            </span>
                                            <small>{animal.mascota_especie} · En Refugio</small>
                                        </label>
                                    ))}
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
                        Autorizo un aporte mensual de{' '}
                        {Number(datos.monto || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}.
                        Puedo solicitar su desactivación al refugio cuando lo necesite.
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
