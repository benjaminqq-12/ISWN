import { useCallback, useEffect, useRef, useState } from 'react';
import { getEventos, getMisInscripciones } from '../../services/evento.service.js';

const useEventos = (autenticado = false) => {
    const [eventos, setEventos] = useState([]);
    const [inscripciones, setInscripciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [errorInscripciones, setErrorInscripciones] = useState(null);
    const solicitudActual = useRef(0);

    const fetchEventos = useCallback(async () => {
        const solicitud = ++solicitudActual.current;
        setLoading(true);
        setError(null);
        setErrorInscripciones(null);

        try {
            const [respuestaEventos, respuestaInscripciones] = await Promise.all([
                getEventos(),
                autenticado ? getMisInscripciones() : Promise.resolve(null)
            ]);
            if (solicitud !== solicitudActual.current) return;
            if (respuestaEventos?.status !== 'Success' || !Array.isArray(respuestaEventos.data)) {
                throw new Error(respuestaEventos?.message || 'No se pudieron obtener los eventos.');
            }
            setEventos(respuestaEventos.data);
            if (!autenticado) {
                setInscripciones([]);
            } else if (respuestaInscripciones?.status === 'Success' && Array.isArray(respuestaInscripciones.data)) {
                setInscripciones(respuestaInscripciones.data);
            } else {
                setInscripciones([]);
                setErrorInscripciones(respuestaInscripciones?.message || 'No se pudieron consultar tus inscripciones. Vuelve a iniciar sesión.');
            }
        } catch (error) {
            if (solicitud !== solicitudActual.current) return;
            setEventos([]);
            setInscripciones([]);
            setError(error.message || 'Error al cargar los eventos.');
        } finally {
            if (solicitud === solicitudActual.current) setLoading(false);
        }
    }, [autenticado]);

    useEffect(() => {
        fetchEventos();
        return () => { solicitudActual.current++; };
    }, [fetchEventos]);

    return { eventos, inscripciones, loading, error, errorInscripciones, refetch: fetchEventos };
};

export default useEventos;
