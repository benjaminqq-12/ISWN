const Paginacion = ({
    paginaActual,
    totalItems,
    itemsPorPagina,
    onCambiarPagina,
    opcionesPorPagina = null,
    onCambiarItemsPorPagina = null,
}) => {
    const totalPaginas = Math.max(1, Math.ceil(totalItems / itemsPorPagina));
    if (totalItems === 0) return null;

    const inicio = (paginaActual - 1) * itemsPorPagina + 1;
    const fin = Math.min(totalItems, paginaActual * itemsPorPagina);

    return (
        <div className="paginacion-barra">
            <span className="paginacion-info">
                Mostrando <strong>{inicio}–{fin}</strong> de <strong>{totalItems}</strong>
            </span>

            <div className="paginacion-controles">
                {Array.isArray(opcionesPorPagina) && onCambiarItemsPorPagina && (
                    <label className="paginacion-selector">
                        Mostrar
                        <select
                            value={itemsPorPagina}
                            onChange={(e) => {
                                onCambiarItemsPorPagina(Number(e.target.value));
                                onCambiarPagina(1);
                            }}
                        >
                            {opcionesPorPagina.map((cantidad) => (
                                <option key={cantidad} value={cantidad}>
                                    {cantidad} por página
                                </option>
                            ))}
                        </select>
                    </label>
                )}

                {totalPaginas > 1 && (
                    <div className="paginacion-botones">
                        <button
                            type="button"
                            className="boton boton-secundario"
                            disabled={paginaActual <= 1}
                            onClick={() => onCambiarPagina(paginaActual - 1)}
                        >
                            Anterior
                        </button>
                        <span className="paginacion-pagina">
                            Página {paginaActual} de {totalPaginas}
                        </span>
                        <button
                            type="button"
                            className="boton boton-secundario"
                            disabled={paginaActual >= totalPaginas}
                            onClick={() => onCambiarPagina(paginaActual + 1)}
                        >
                            Siguiente
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Paginacion;
