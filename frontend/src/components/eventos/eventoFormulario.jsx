import { useState } from 'react';
import { fechaActualChile } from '../../helpers/formatoFecha.js';

const EventoFormulario = ({ evento, organizadores, guardando, error, onGuardar, onCancelar }) => {
    const [datos, setDatos] = useState({
        titulo: evento?.titulo || '',
        descripcion: evento?.descripcion || '',
        categoria: evento?.categoria || '',
        fechaEvento: evento?.fechaEvento || '',
        horaInicio: evento?.horaInicio || '',
        horaFin: evento?.horaFin || '',
        lugar: evento?.lugar || '',
        capacidadMaxima: evento?.capacidadMaxima || '',
        organizadorId: evento?.organizador?.usuarioId || ''
    });
    const [errorFormulario, setErrorFormulario] = useState('');

    const cambiarCampo = (event) => {
        setDatos({ ...datos, [event.target.name]: event.target.value });
        setErrorFormulario('');
    };

    const esBorrador = !evento || evento.estado === 'Borrador';

    const guardar = (event) => {
        event.preventDefault();
        
        if (guardando) return;
        const borrador = event.nativeEvent.submitter?.value === 'borrador';
        if (!borrador && datos.fechaEvento < fechaActualChile()) {
            setErrorFormulario('La fecha del evento no puede estar en el pasado.');
            return;
        }
        if (!borrador && datos.horaFin <= datos.horaInicio) {
            setErrorFormulario('La hora de término debe ser posterior al inicio, dentro del mismo día.');
            return;
        }
        if (!datos.titulo.trim()) {
            setErrorFormulario('Escribe un título para identificar el evento.');
            return;
        }

        const valores = Object.fromEntries(
            Object.entries(datos).map(([campo, valor]) => [campo, valor === '' ? null : valor])
        );

        onGuardar({
            ...valores,
            titulo: datos.titulo.trim(),
            descripcion: datos.descripcion.trim() || null,
            lugar: datos.lugar.trim() || null,
            capacidadMaxima: datos.capacidadMaxima ? Number(datos.capacidadMaxima) : null,
            organizadorId: datos.organizadorId ? Number(datos.organizadorId) : null,
            ...(evento?.estado === 'Borrador' ? { version: evento.version } : {})
        }, borrador);
    };

    return (
        <form className="evento-formulario" onSubmit={guardar}>
            <fieldset disabled={guardando}>
                <label className="evento-campo-completo">Título
                    <input name="titulo" value={datos.titulo} onChange={cambiarCampo} required maxLength={150} />
                </label>
                <label className="evento-campo-completo">Descripción
                    <textarea name="descripcion" value={datos.descripcion} onChange={cambiarCampo} required rows={4} />
                </label>
                <label>Categoría
                    <select name="categoria" value={datos.categoria} onChange={cambiarCampo} required>
                        <option value="">Selecciona una categoría</option>
                        <option value="adopcion">Adopción</option>
                        <option value="salud">Salud</option>
                        <option value="taller">Taller</option>
                        <option value="feria">Feria</option>
                    </select>
                </label>
                <label>Fecha
                    <input name="fechaEvento" type="date" min={fechaActualChile()}
                        value={datos.fechaEvento} onChange={cambiarCampo} required />
                </label>
                <label>Hora de inicio
                    <input name="horaInicio" type="time" value={datos.horaInicio} onChange={cambiarCampo} required />
                </label>
                <label>Hora de término
                    <input name="horaFin" type="time" value={datos.horaFin} onChange={cambiarCampo} required />
                </label>
                <label className="evento-campo-completo">Lugar
                    <input name="lugar" value={datos.lugar} onChange={cambiarCampo} required maxLength={200} />
                </label>
                <label>Capacidad máxima
                    <input name="capacidadMaxima" type="number" min="1" max="2147483647" step="1"
                        value={datos.capacidadMaxima} onChange={cambiarCampo} required />
                </label>
                <label>Organizador
                    <select name="organizadorId" value={datos.organizadorId} onChange={cambiarCampo} required>
                        <option value="">Selecciona un voluntario</option>
                        {organizadores.map(organizador => (
                            <option key={organizador.usuarioId} value={organizador.usuarioId}>
                                {organizador.usuarioNombre}
                            </option>
                        ))}
                    </select>
                </label>
            </fieldset>
            <p className="evento-info">Puedes guardar un borrador con solo el título. Al publicar se exigirán todos los datos y se comprobarán la fecha y los horarios de Chile.</p>
            {(errorFormulario || error) && <p className="mensaje mensaje-error" role="alert">{errorFormulario || error}</p>}
            <div className="evento-acciones">
                {esBorrador && (
                    <button type="submit" value="borrador" formNoValidate className="boton boton-secundario" disabled={guardando}>
                        Guardar borrador
                    </button>
                )}
                <button type="submit" value="publicar" className="boton boton-primario" disabled={guardando || organizadores.length === 0}>
                    {guardando ? 'Guardando…' : esBorrador ? 'Publicar evento' : 'Guardar cambios'}
                </button>
                <button type="button" className="boton boton-secundario" onClick={onCancelar} disabled={guardando}>
                    Cancelar
                </button>
            </div>
        </form>
    );
};

export default EventoFormulario;
