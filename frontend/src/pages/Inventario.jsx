import { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { ArrowDownUp, Boxes, CircleAlert, ClipboardList, Pencil, Plus, Search } from "lucide-react";
import ItemInventarioForm from "../components/inventario/ItemInventarioForm.jsx";
import MovimientoInventarioForm from "../components/inventario/MovimientoInventarioForm.jsx";
import HistorialInventario from "../components/inventario/HistorialInventario.jsx";
import {
  listarInventario, crearItemInventario, editarItemInventario,
  registrarMovimiento, listarMovimientos, mensajeErrorInventario,
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
    setGuardando(true);
    setErrorFormulario("");
    try {
      await registrarMovimiento(token, modal.item.inventarioId, datos);
      setModal(null);
      setMensaje("Movimiento registrado correctamente.");
      await recargar();
    } catch (e) {
      setErrorFormulario(mensajeErrorInventario(e));
    } finally {
      setGuardando(false);
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
        <button className="boton boton-primario" type="button" onClick={() => abrirModal("crear")}>
          <Plus aria-hidden="true" /> Agregar artículo
        </button>
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
                onClick={() => setCategoria(opcion.value)}>{opcion.label}</button>
            ))}
          </div>
          <label className="inventario-busqueda">
            <Search aria-hidden="true" />
            <span className="solo-lectores">Buscar artículo</span>
            <input type="search" placeholder="Buscar artículo..." value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)} />
          </label>
        </div>

        {mensaje && <p className="inventario-aviso" role="status">{mensaje}</p>}
        {cargando ? <p className="inventario-vacio" role="status">Cargando inventario...</p>
          : error ? <div className="inventario-vacio" role="alert"><p>{error}</p><button className="boton boton-secundario" onClick={recargar}>Reintentar</button></div>
          : filtrados.length === 0 ? <p className="inventario-vacio">No hay artículos que coincidan con tu búsqueda.</p>
          : (
            <div className="inventario-tabla-contenedor">
              <table className="inventario-tabla">
                <thead><tr><th>Artículo</th><th>Categoría</th><th>Stock disponible</th><th>Stock mínimo</th><th>Estado</th><th>Acciones</th></tr></thead>
                <tbody>{filtrados.map((item) => {
                  const stock = Number(item.stock);
                  const minimo = Number(item.stockMinimo);
                  const bajo = stock <= minimo;
                  return (
                    <tr key={item.inventarioId}>
                      <td><span className="inventario-nombre">{item.nombre}</span>
                        {item.descripcion && <span className="inventario-descripcion">{item.descripcion}</span>}</td>
                      <td>{CATEGORIA_LABEL[item.categoria]}{item.categoria === "comida" ? ` · ${item.subcategoria === "perro" ? "Perros" : "Gatos"}` : ""}</td>
                      <td className="inventario-cantidad">{stock.toLocaleString("es-CL")} {item.unidad}</td>
                      <td>{minimo.toLocaleString("es-CL")} {item.unidad}</td>
                      <td><span className={`inventario-estado ${bajo ? "bajo" : "disponible"}`}>
                        {stock === 0 ? "Agotado" : bajo ? "Stock bajo" : "Disponible"}
                      </span></td>
                      <td><div className="inventario-acciones">
                        <button type="button" className="boton boton-secundario" title="Editar artículo" onClick={() => abrirModal("editar", item)}><Pencil aria-hidden="true" /> Editar</button>
                        <button type="button" className="boton boton-verde" onClick={() => abrirModal("movimiento", item)}><ArrowDownUp aria-hidden="true" /> Movimiento</button>
                        <button type="button" className="inventario-enlace" onClick={() => abrirModal("historial", item)}>Historial</button>
                      </div></td>
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
