import axios from './root.service.js';

export const getConfiguracionDonaciones = async () => {
    try {
        const response = await axios.get('/donacion/configuracion');
        return response.data;
    } catch (error) {
        return error.response?.data || { status: 'Error', message: 'Error de conexión con el servidor.' };
    }
};

export const getAnimalesApadrinables = async () => {
    try {
        const response = await axios.get('/donacion/animales');
        return response.data;
    } catch (error) {
        return error.response?.data || { status: 'Error', message: 'Error de conexión con el servidor.' };
    }
};

export const iniciarAporte = async (datos) => {
    try {
        const response = await axios.post('/donacion', datos);
        return response.data;
    } catch (error) {
        return error.response?.data || { status: 'Error', message: 'Error de conexión con el servidor.' };
    }
};

export const getEstadoAporte = async (donacionId) => {
    try {
        const response = await axios.get(`/donacion/estado/${donacionId}`);
        return response.data;
    } catch (error) {
        return error.response?.data || { status: 'Error', message: 'Error de conexión con el servidor.' };
    }
};

export const getRecaudaciones = async (filtros) => {
    try {
        const response = await axios.get('/donacion/gestion', { params: filtros });
        return response.data;
    } catch (error) {
        return error.response?.data || { status: 'Error', message: 'Error de conexión con el servidor.' };
    }
};

export const confirmarDonacion = async (donacionId) => {
    try {
        const response = await axios.patch(`/donacion/${donacionId}/confirmar`);
        return response.data;
    } catch (error) {
        return error.response?.data || { status: 'Error', message: 'Error de conexión con el servidor.' };
    }
};

export const descartarDonacionPendiente = async (donacionId) => {
    try {
        const response = await axios.delete(`/donacion/${donacionId}/pendiente`);
        return response.data;
    } catch (error) {
        return error.response?.data || { status: 'Error', message: 'Error de conexión con el servidor.' };
    }
};

export const desactivarSuscripcion = async (suscripcionId, motivo) => {
    try {
        const response = await axios.patch(`/donacion/suscripciones/${suscripcionId}/desactivar`, { motivo });
        return response.data;
    } catch (error) {
        return error.response?.data || { status: 'Error', message: 'Error de conexión con el servidor.' };
    }
};

export const descargarListado = async (filtros, listado) => {
    const response = await axios.get('/donacion/gestion/exportar', {
        params: { ...filtros, listado },
        responseType: 'blob',
    });
    const url = URL.createObjectURL(response.data);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `${listado}-${filtros.anio}${filtros.mes ? `-${filtros.mes}` : ''}.csv`;
    enlace.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
};