import axios from './root.service.js';

export const getEventos = async (categoria = null) => {
    try {
        const config = categoria && categoria !== 'todos' ? { params: { categoria } } : {};
        const response = await axios.get('/eventos', config);
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

export const crearEvento = async (datosEvento) => {
    try {
        const response = await axios.post('/eventos', datosEvento);
        return response.data;
    } catch (error) {
        return error.response?.data || { status: 'Error', message: 'Error de conexión con el servidor.' };
    }
};

export const actualizarEvento = async (eventoId, datosActualizados) => {
    try {
        const response = await axios.put(`/eventos/${eventoId}`, datosActualizados);
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

export const getMisInscripciones = async () => {
    try {
        const response = await axios.get('/eventos/mis-inscripciones');
        return response.data;
    } catch (error) {
        return error.response?.data || { status: 'Error', message: 'Error de conexión con el servidor.' };
    }
};

export const getEventosGestion = async () => {
    try {
        const response = await axios.get('/eventos/gestion');
        return response.data;
    } catch (error) {
        return error.response?.data || { status: 'Error', message: 'Error de conexión con el servidor.' };
    }
};

export const getOrganizadores = async () => {
    try {
        const response = await axios.get('/eventos/organizadores');
        return response.data;
    } catch (error) {
        return error.response?.data || { status: 'Error', message: 'Error de conexión con el servidor.' };
    }
};

export const guardarBorradorEvento = async (eventoId, datos) => {
    try {
        const respuesta = eventoId
            ? await axios.put(`/eventos/borradores/${eventoId}`, datos)
            : await axios.post('/eventos/borradores', datos);
        return respuesta.data;
    } catch (error) {
        return error.response?.data || { status: 'Error', message: 'No se pudo guardar el borrador.' };
    }
};

export const publicarEvento = async (eventoId, datos) => {
    try {
        const respuesta = await axios.post(`/eventos/${eventoId}/publicar`, datos);
        return respuesta.data;
    } catch (error) {
        return error.response?.data || { status: 'Error', message: 'No se pudo publicar el evento.' };
    }
};
