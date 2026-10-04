import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { fechaLocal } from '../../helpers/formatoFecha.js';
import '../../styles/calendario.css';

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const eventoCalendario = ({ eventos, onDetalles, ocupado, loading, error }) => {
    const [mes, setMes] = useState(new Date());
    const anio = mes.getFullYear();
    const numeroMes = mes.getMonth();
    const primerDia = new Date(anio, numeroMes, 1);
    const diasAnteriores = (primerDia.getDay() + 6) % 7;
    const cantidadDias = new Date(anio, numeroMes + 1, 0).getDate();
    const cantidadCeldas = Math.ceil((diasAnteriores + cantidadDias) / 7) * 7;
    const semanas = [];
    const hoy = new Date().toDateString();

    for (let i = 0; i < cantidadCeldas; i += 7) {
        const semana = [];
        for (let j = 0; j < 7; j++) {
            semana.push(new Date(anio, numeroMes, 1 - diasAnteriores + i + j, 12));
        }
        semanas.push(semana);
    }

    const cambiarMes = (cantidad) => {
        setMes(new Date(anio, numeroMes + cantidad, 1));
    };

    return (
        <section id="calendario" className="calendario" aria-labelledby="titulo-calendario">
            <div className="calendario-cabecera">
                <div>
                    <h2 id="titulo-calendario" className="titulo-seccion">Explorar por Calendario</h2>
                    <p className="descripcion-seccion">Encuentra los próximos encuentros de nuestra comunidad.</p>
                </div>
                <div className="calendario-navegacion">
                    <button type="button" className="boton-icono" aria-label="Mes anterior"
                        onClick={() => cambiarMes(-1)}><ChevronLeft /></button>
                    <span aria-live="polite">
                        {mes.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
                    </span>
                    <button type="button" className="boton-icono" aria-label="Mes siguiente"
                        onClick={() => cambiarMes(1)}><ChevronRight /></button>
                </div>
            </div>

            <div className="calendario-panel">
                {loading && <p className="calendario-aviso" role="status">Cargando eventos del calendario…</p>}
                {!loading && error && (
                    <p className="calendario-aviso" role="status">No se pudieron cargar los eventos del calendario.</p>
                )}
                <p className="calendario-ayuda">Desliza el calendario para ver toda la semana.</p>
                <div className="calendario-scroll" role="region" aria-label="Calendario mensual de eventos" tabIndex={0}>
                    <table className="calendario-tabla">
                        <caption className="solo-lectores">
                            Eventos de {mes.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
                        </caption>
                        <thead>
                            <tr>{DIAS.map(dia => <th key={dia} scope="col">{dia}</th>)}</tr>
                        </thead>
                        <tbody>
                            {semanas.map((semana, indice) => (
                                <tr key={indice}>
                                    {semana.map(fecha => {
                                        const eventosDelDia = eventos.filter(evento =>
                                            fechaLocal(evento.fechaEvento)?.toDateString() === fecha.toDateString()
                                        );
                                        return (
                                            <td key={fecha.toDateString()}
                                                className={fecha.getMonth() === numeroMes ? 'calendario-dia' : 'calendario-dia fuera-del-mes'}>
                                                <time aria-current={fecha.toDateString() === hoy ? 'date' : undefined}>
                                                    {fecha.getDate()}
                                                </time>
                                                <div className="calendario-eventos">
                                                    {eventosDelDia.map(evento => (
                                                        <button key={evento.eventoId} type="button"
                                                            className="calendario-evento" disabled={ocupado}
                                                            title={evento.titulo} onClick={() => onDetalles(evento.eventoId)}>
                                                            {evento.titulo}
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
};

export default eventoCalendario;
