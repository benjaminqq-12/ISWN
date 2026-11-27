import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ArrowDownUp, Boxes, CircleAlert, ClipboardList, Pencil, Plus, Search, Trash2, ListChecks, X, } from "lucide-react";
import ItemInventarioForm from "../components/inventario/ItemInventarioForm.jsx";
import MovimientoInventarioForm from "../components/inventario/MovimientoInventarioForm.jsx";
import HistorialInventario from "../components/inventario/HistorialInventario.jsx";
import {
  listarInventario, crearItemInventario, editarItemInventario,
  registrarMovimiento, listarMovimientos, mensajeErrorInventario,
  eliminarItemInventario, eliminarItemsInventarioLote,
} from "../services/inventario.service.js";
import "../styles/inventario.css";

const CATEGORIAS = [
  { value: "", label: "Todas" },
  { value: "comida", label: "Comida de animales" },
  { value: "medico", label: "Insumos médicos" },
  { value: "limpieza", label: "Insumos de limpieza" },
  { value: "oficina", label: "Artículos de oficina" },
];

const CATEGORIA_LABEL = Object.fromEntries(CATEGORIAS.map(({ value, label }) => [value, label]));

export default function Inventario() {
  const { session } = useOutletContext();
  const token = session.token;
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [categoria, setCategoria] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [modal, setModal] = useState(null); // { tipo, item? }
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [movimientos, setMovimientos] = useState([]);
  const [cargandoMovimientos, setCargandoMovimientos] = useState(false);
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [seleccionados, setSeleccionados] = useState([]);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminacion, setErrorEliminacion] = useState("");

  const recargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      setItems(await listarInventario(token));
    } catch (e) {
      setError(mensajeErrorInventario(e));
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => { Promise.resolve().then(recargar); }, [recargar]);

  const filtrados = useMemo(() => items.filter((item) => (
    (!categoria || item.categoria === categoria)
    && `${item.nombre} ${item.descripcion ?? ""}`.toLocaleLowerCase("es").includes(busqueda.trim().toLocaleLowerCase("es"))
  )), [items, categoria, busqueda]);

  const criticos = items.filter((item) => Number(item.stock) <= Number(item.stockMinimo)).length;
  const agotados = items.filter((item) => Number(item.stock) === 0).length;

  function abrirModal(tipo, item = null) {
    setErrorFormulario("");
    setMensaje("");
    setModal({ tipo, item });
    if (tipo === "historial") {
      setMovimientos([]);
      setCargandoMovimientos(true);
      listarMovimientos(token, item.inventarioId)
        .then(setMovimientos)
        .catch((e) => setErrorFormulario(mensajeErrorInventario(e)))
        .finally(() => setCargandoMovimientos(false));
    }
  }

  async function guardarItem(datos) {
    setGuardando(true);
    setErrorFormulario("");
    try {
      if (modal.item) await editarItemInventario(token, modal.item.inventarioId, datos);
      else await crearItemInventario(token, datos);
      setModal(null);
      setMensaje(modal.item ? "Artículo actualizado correctamente." : "Artículo registrado correctamente.");
      await recargar();
    } catch (e) {
      setErrorFormulario(mensajeErrorInventario(e));
    } finally {
      setGuardando(false);
    }
  }

  async function guardarMovimiento(datos) {
    setErrorFormulario("");

    const item = modal.item;
    const stockActual = Number(item.stock);
    const stockMinimo = Number(item.stockMinimo);

    let confirmado = false;

    // Comprobaciones visuales antes de enviar la solicitud.
    if (datos.tipo === "salida") {

      // Avisar cuando no hay stock suficiente.
      if (datos.cantidad > stockActual) {
        setErrorFormulario(
          `No se cuenta con stock suficiente para realizar la salida. Disponible: ${stockActual} ${item.unidad}.`
        );
        return;
      }

      const restante = Number(
        (stockActual - datos.cantidad).toFixed(2)
      );

      // Pedir confirmación cuando se alcanza o supera
      // el límite mínimo permitido.
      if (restante <= stockMinimo) {
        let aviso;

        if (restante === 0) {
          aviso =
            `Esta salida dejará a "${item.nombre}" sin stock. ` +
            "¿Deseas continuar?";
        } else if (restante === stockMinimo) {
          aviso =
            `Esta salida dejará a "${item.nombre}" exactamente ` +
            `en su stock mínimo de ${stockMinimo} ${item.unidad}. ` +
            "¿Deseas continuar?";
        } else {
          aviso =
            `Esta salida dejará a "${item.nombre}" por debajo ` +
            `del stock mínimo de ${stockMinimo} ${item.unidad}. ` +
            `Quedarán ${restante} ${item.unidad}. ` +
            "¿Deseas continuar?";
        }

        confirmado = window.confirm(aviso);

        if (!confirmado) return;
      }
    }

    setGuardando(true);

    const ejecutarMovimiento = (confirmacion) =>
      registrarMovimiento(
        token,
        item.inventarioId,
        {
          ...datos,
          confirmarBajoStock: confirmacion,
        }
      );

    try {
      try {
        await ejecutarMovimiento(confirmado);

      } catch (errorMovimiento) {
        const detalles =
          errorMovimiento.response?.data?.details;

        // Si el stock cambió desde que se abrió el modal,
        // el backend puede exigir una nueva confirmación.
        if (
          errorMovimiento.response?.status === 409 &&
          detalles?.codigo === "CONFIRMACION_REQUERIDA" &&
          !confirmado
        ) {
          const aceptar = window.confirm(
            errorMovimiento.response.data.message
          );

          if (!aceptar) return;

          await ejecutarMovimiento(true);
        } else {
          throw errorMovimiento;
        }
      }

      setModal(null);
      setMensaje("Movimiento registrado correctamente.");
      await recargar();

    } catch (errorMovimiento) {

      // Actualizar la información del modal cuando
      // el servidor informa que el stock cambió.
      const detalles =
        errorMovimiento.response?.data?.details;

      if (detalles?.stockActual !== undefined) {
        setModal((actual) => ({
          ...actual,
          item: {
            ...actual.item,
            stock: detalles.stockActual,
            stockMinimo:
              detalles.stockMinimo ?? actual.item.stockMinimo,
          },
        }));
      }

      setErrorFormulario(
        mensajeErrorInventario(errorMovimiento)
      );

    } finally {
      setGuardando(false);
    }
  }

  const visiblesIds = filtrados.map((item) => item.inventarioId);
  const todosVisiblesSeleccionados = visiblesIds.length > 0 && visiblesIds.every((id) => seleccionados.includes(id));

  function entrarEnSeleccion() {
    if (eliminando || guardando) return;
    setModal(null);
    setModoSeleccion(true);
    setSeleccionados([]);
    setErrorEliminacion("");
    setMensaje("");
  }

  function salirDeSeleccion() {
    if (eliminando) return;
    setModoSeleccion(false);
    setSeleccionados([]);
    setErrorEliminacion("");
  }

  function alternarSeleccion(id) {
    if (eliminando) return;
    setSeleccionados((actuales) => actuales.includes(id) ? actuales.filter((x) => x !== id) : [...actuales, id]);
  }

  function seleccionarTodosVisibles(marcar) {
    if (eliminando) return;
    setSeleccionados(marcar ? visiblesIds : []);
  }

  //eliminar un item individual
  async function eliminarUno(item) {
    if (eliminando || guardando) return;

    // 1. Solicitar confirmación.
    const confirmar = window.confirm(
      `¿Estás seguro que deseas eliminar "${item.nombre}"?\n\n` +
      "Se eliminará permanentemente el artículo y " +
      "TODO su historial de movimientos, incluido " +
      "el stock inicial.\n\n" +
      "Esta acción no se puede deshacer."
    );

    if (!confirmar) return;

    setEliminando(true);
    setErrorEliminacion("");
    setMensaje("");

    try {
      // 2. Ejecutar la eliminación desde el backend.
      const resultado = await eliminarItemInventario(token, item.inventarioId);

      // 3. Comprobar la estructura del resultado.
      if (!Array.isArray(resultado?.idsEliminados)) {
        throw new Error( "El servidor no devolvió los identificadores " + "eliminados. Recarga el inventario antes de " + "repetir la operación.");
      }

      // 4. Preparar los IDs que fueron eliminados.
      const eliminados = new Set(resultado.idsEliminados.map(Number));

      // 5. Actualizar la tabla.
      setItems((actuales) => actuales.filter((actual) => !eliminados.has(Number(actual.inventarioId))));

      // 6. Informar el resultado.
      setMensaje("Artículo eliminado permanentemente junto con " + `${resultado.cantidadMovimientosEliminados} ` + "movimientos de su historial.");

    } catch (error) {
      setErrorEliminacion(mensajeErrorInventario(error));

      // Recuperar los datos actuales si la
      // respuesta no tiene el formato esperado.
      await recargar();

    } finally {
      setEliminando(false);
    }
  }


  //eliminar varios items seleccionados
  async function eliminarVarios() {
    if (eliminando || guardando) return;

    // 1. Obtener únicamente los seleccionados visibles.
    const ids = visiblesIds.filter((id) => seleccionados.includes(id));

    if (ids.length === 0) return;

    // 2. Respetar el límite definido en Joi.
    if (ids.length > 50) {
      setErrorEliminacion( "Puedes eliminar un máximo de 50 " + "artículos por operación." );
      return;
    }

    // 3. Confirmación general del lote.
    const confirmar = window.confirm(
      `¿Estás seguro que deseas eliminar ${ids.length} ` +
      `${ids.length === 1 ? "artículo" : "artículos"}?\n\n` +
      "Se eliminarán permanentemente TODOS los " +
      "artículos seleccionados y TODO su historial " +
      "de movimientos.\n\n" +
      "Esta acción es irreversible."
    );

    if (!confirmar) return;

    setEliminando(true);
    setErrorEliminacion("");
    setMensaje("");

    try {
      // 4. Enviar una sola solicitud al backend.
      const resultado = await eliminarItemsInventarioLote(token, ids);

      // 5. Validar la estructura recibida.
      if (!Array.isArray(resultado?.idsEliminados)) {
        throw new Error( "El servidor no devolvió los identificadores " + "eliminados. Recarga el inventario antes " + "de repetir la operación.");
      }

      // 6. Preparar los IDs eliminados.
      const eliminados = new Set(resultado.idsEliminados.map(Number));

      // 7. Actualizar el catálogo.
      setItems((actuales) => actuales.filter( (actual) => !eliminados.has( Number(actual.inventarioId))));

      // 8. Mostrar el resultado.
      setMensaje(
        `Se eliminaron ${resultado.cantidadEliminada} ` +
        `${resultado.cantidadEliminada === 1
          ? "artículo"
          : "artículos"} y ` +
        `${resultado.cantidadMovimientosEliminados} ` +
        "movimientos de su historial."
      );

      // 9. Desactivar la selección múltiple.
      setSeleccionados([]);
      setModoSeleccion(false);

    } catch (error) {
      setErrorEliminacion(
        mensajeErrorInventario(error)
      );

      await recargar();

    } finally {
      setEliminando(false);
    }
  }

  return (
    <section className="inventario-pagina" aria-labelledby="inventario-titulo">
      <div className="inventario-encabezado">
        <div>
          <p className="inventario-etiqueta">Gestión interna del refugio</p>
          <h1 id="inventario-titulo" className="titulo-seccion">Inventario</h1>
          <p className="descripcion-seccion">Controla las existencias de alimentos, insumos y artículos del refugio.</p>
        </div>
        <div className="inventario-encabezado-acciones">
        <button
          type="button"
          className={`boton boton-secundario inventario-boton-seleccion ${
            modoSeleccion ? "activo" : ""
          }`}
          onClick={
            modoSeleccion
              ? salirDeSeleccion
              : entrarEnSeleccion
          }
          disabled={eliminando || guardando}
          aria-pressed={modoSeleccion}
        >
          {modoSeleccion
            ? <X aria-hidden="true" />
            : <ListChecks aria-hidden="true" />
          }

          {modoSeleccion
            ? "Cancelar selección"
            : "Seleccionar varios"}
        </button>

        {!modoSeleccion && (
          <button
            className="boton boton-primario"
            type="button"
            onClick={() => abrirModal("crear")}
            disabled={eliminando}
          >
            <Plus aria-hidden="true" />
            Agregar artículo
          </button>
        )}

      </div>
      </div>

      <div className="inventario-resumen" aria-label="Resumen del inventario">
        <div className="inventario-indicador"><Boxes aria-hidden="true" /><div><strong>{items.length}</strong><span>Artículos registrados</span></div></div>
        <div className="inventario-indicador"><CircleAlert aria-hidden="true" /><div><strong>{criticos}</strong><span>Con stock bajo o mínimo</span></div></div>
        <div className="inventario-indicador"><ClipboardList aria-hidden="true" /><div><strong>{agotados}</strong><span>Sin existencias</span></div></div>
      </div>

      <div className="inventario-panel">
        <div className="inventario-filtros">
          <div className="inventario-categorias" aria-label="Filtrar por categoría">
            {CATEGORIAS.map((opcion) => (
              <button key={opcion.value} type="button"
                className={`inventario-filtro ${categoria === opcion.value ? "seleccionado" : ""}`}
                aria-pressed={categoria === opcion.value}
                onClick={() => {setCategoria(opcion.value); setSeleccionados([]);}}>{opcion.label}</button>
            ))}
          </div>
          <label className="inventario-busqueda">
            <Search aria-hidden="true" />
            <span className="solo-lectores">Buscar artículo</span>
            <input type="search" placeholder="Buscar artículo..." value={busqueda}
              onChange={(event) => {setBusqueda(event.target.value); setSeleccionados([]);}} />
          </label>
        </div>
        {modoSeleccion && (
          <div className="inventario-barra-seleccion">
            <label className="inventario-seleccionar-todos">
              <input type="checkbox" checked={todosVisiblesSeleccionados} disabled={ eliminando || visiblesIds.length === 0}
                onChange={(event) => seleccionarTodosVisibles( event.target.checked )}
              />
              Seleccionar todos los visibles
            </label>

            <span role="status">
              {seleccionados.length} de {filtrados.length} seleccionados
              {" "}(máximo 50 por eliminación)
            </span>

            <button type="button" className="boton inventario-boton-peligro" disabled={
                eliminando ||
                seleccionados.length === 0 ||
                seleccionados.length > 50
              }
              onClick={eliminarVarios}
            >
              <Trash2 aria-hidden="true" />


              {eliminando ? "Eliminando..." : `Eliminar seleccionados (${seleccionados.length})`}
            </button>

          </div>
        )}
        {mensaje && <p className="inventario-aviso" role="status">{mensaje}</p>}
        {errorEliminacion && <p className="inventario-error inventario-mensaje-eliminacion" role="alert">{errorEliminacion}</p>}
        {cargando ? <p className="inventario-vacio" role="status">Cargando inventario...</p>
          : error ? <div className="inventario-vacio" role="alert"><p>{error}</p><button className="boton boton-secundario" onClick={recargar}>Reintentar</button></div>
          : filtrados.length === 0 ? <p className="inventario-vacio">No hay artículos que coincidan con tu búsqueda.</p>
          : (
            <div className="inventario-tabla-contenedor">
              <table className="inventario-tabla">
                <thead><tr>{modoSeleccion && (<th scope="col" >Elegir</th>)}
                  <th>Artículo</th><th>Categoría</th><th>Stock disponible</th><th>Stock mínimo</th><th>Estado</th>
                  {!modoSeleccion && (<th>Acciones</th>)}</tr></thead>
                <tbody>{filtrados.map((item) => {
                  const stock = Number(item.stock);
                  const minimo = Number(item.stockMinimo);
                  const bajo = stock <= minimo;
                  return (
                    <tr key={item.inventarioId} className={modoSeleccion && seleccionados.includes(item.inventarioId) ? "inventario-fila-seleccionada" : ""}>
                      {modoSeleccion && (<td><input type="checkbox" checked={seleccionados.includes(item.inventarioId)} disabled={eliminando} onChange={() => 
                        alternarSeleccion(item.inventarioId)} aria-label={`Seleccionar ${item.nombre}`} /></td>)}
                      <td><span className="inventario-nombre">{item.nombre}</span>
                        {item.descripcion && <span className="inventario-descripcion">{item.descripcion}</span>}</td>
                      <td>{CATEGORIA_LABEL[item.categoria]}{item.categoria === "comida" ? ` · ${item.subcategoria === "perro" ? "Perros" : "Gatos"}` : ""}</td>
                      <td className="inventario-cantidad">{stock.toLocaleString("es-CL")} {item.unidad}</td>
                      <td>{minimo.toLocaleString("es-CL")} {item.unidad}</td>
                      <td><span className={`inventario-estado ${bajo ? "bajo" : "disponible"}`}>
                        {stock === 0 ? "Agotado" : bajo ? "Stock bajo" : "Disponible"}
                      </span></td>
                      {!modoSeleccion && (
                        <td><div className="inventario-acciones">
                          <button type="button" className="boton boton-secundario" title="Editar artículo" disabled={eliminando} onClick={() => abrirModal("editar", item)}><Pencil aria-hidden="true" /> Editar</button>
                          <button type="button" className="boton boton-verde" disabled={eliminando} onClick={() => abrirModal("movimiento", item)}><ArrowDownUp aria-hidden="true" /> Movimiento</button>
                          <button type="button" className="inventario-enlace" disabled={eliminando} onClick={() => abrirModal("historial", item)}>Historial</button>
                          <button type="button" className="inventario-papelera" disabled={eliminando} onClick={() => eliminarUno(item)} title={`Eliminar ${item.nombre} y su historial`} aria-label={`Eliminar ${item.nombre} y su historial`}><Trash2 aria-hidden="true" /></button>
                        </div></td>
                      )}
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          )}
      </div>

      {(modal?.tipo === "crear" || modal?.tipo === "editar") && (
        <ItemInventarioForm item={modal.item} guardando={guardando} error={errorFormulario}
          onSubmit={guardarItem} onClose={() => !guardando && setModal(null)} />
      )}
      {modal?.tipo === "movimiento" && (
        <MovimientoInventarioForm item={modal.item} guardando={guardando} error={errorFormulario}
          onSubmit={guardarMovimiento} onClose={() => !guardando && setModal(null)} />
      )}
      {modal?.tipo === "historial" && (
        <HistorialInventario item={modal.item} movimientos={movimientos} cargando={cargandoMovimientos}
          error={errorFormulario} onClose={() => setModal(null)} />
      )}
    </section>
  );
}
