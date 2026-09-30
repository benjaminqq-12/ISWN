import { useEffect, useState } from 'react';
import { getEventos, getMisInscripciones } from '../../services/evento.service.js';

const useEventos = (activo = true) => {
    const [eventos, setEventos] = useState([]);
    const [inscripciones, setInscripciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [errorInscripciones, setErrorInscripciones] = useState(null);

    const fetchEventos = async () => {
        setLoading(true);
        setError(null);
        setErrorInscripciones(null);

        try {
            const [respuestaEventos, respuestaInscripciones] = await Promise.all([
                getEventos(),
                getMisInscripciones()
            ]);

            if (respuestaEventos?.status === 'Success' && Array.isArray(respuestaEventos.data)) {
                setEventos(respuestaEventos.data);
            } else {
                throw new Error(respuestaEventos?.message || 'No se pudieron obtener los eventos.');
            }

            if (respuestaInscripciones?.status === 'Success' && Array.isArray(respuestaInscripciones.data)) {
                setInscripciones(respuestaInscripciones.data);
            } else {
                setInscripciones([]);
                setErrorInscripciones(
                    respuestaInscripciones?.message || 'No se pudieron consultar tus inscripciones.'
                );
            }
        } catch (error) {
            setEventos([]);
            setInscripciones([]);
            setError(error.message || 'Error al cargar los eventos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activo) fetchEventos();
    }, [activo]);

    return { eventos, inscripciones, loading, error, errorInscripciones, refetch: fetchEventos };
};

export default useEventos;
