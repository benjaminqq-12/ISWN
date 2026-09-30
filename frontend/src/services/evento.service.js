import axios from './root.service.js';

export const crearEvento = async (datosEvento) => {
    try {
        const response = await axios.post('/eventos', datosEvento);
        return response.data;
    } catch (error) {
        return error.response?.data || { status: 'Error', message: 'Error de conexión con el servidor.' };
    }
};

export const actualizarEvento = async (eventoId, datosEvento) => {
    try {
        const response = await axios.put(`/eventos/${eventoId}`, datosEvento);
        return response.data;
    } catch (error) {
        return error.response?.data || { status: 'Error', message: 'Error de conexión con el servidor.' };
    }
};

export const eliminarEvento = async (eventoId) => {
    try {
        const response = await axios.delete(`/eventos/${eventoId}`);
        return response.data;
    } catch (error) {
        return error.response?.data || { status: 'Error', message: 'Error de conexión con el servidor.' };
    }
};

export const getEventos = async () => {
    try {
        const response = await axios.get('/eventos');
        return response.data;
    } catch (error) {
        return error.response?.data || { status: 'Error', message: 'Error de conexión con el servidor.' };
    }
};

export const getEventoById = async (eventoId) => {
    try {
        const response = await axios.get(`/eventos/${eventoId}`);
        return response.data;
    } catch (error) {
        return error.response?.data || { status: 'Error', message: 'Error de conexión con el servidor.' };
    }
};

export const getMisInscripciones = async () => {
    try {
        const response = await axios.get('/eventos/mis-inscripciones');
        return response.data;
    } catch (error) {
        return error.response?.data || { status: 'Error', message: 'Error de conexión con el servidor.' };
    }
};

export const inscribirseEvento = async (eventoId) => {
    try {
        const response = await axios.post(`/eventos/${eventoId}/inscripcion`);
        return response.data;
    } catch (error) {
        return error.response?.data || { status: 'Error', message: 'Error de conexión con el servidor.' };
    }
};

export const cancelarInscripcion = async (eventoId) => {
    try {
        const response = await axios.delete(`/eventos/${eventoId}/inscripcion`);
        return response.data;
    } catch (error) {
        return error.response?.data || { status: 'Error', message: 'Error de conexión con el servidor.' };
    }
};
