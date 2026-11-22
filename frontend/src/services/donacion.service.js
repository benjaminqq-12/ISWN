import axios from './root.service.js';
import { jsPDF } from 'jspdf';

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

const NOMBRE_CATEGORIA_INSUMO = {
    comida: 'Comida',
    medicamentos: 'Medicamentos',
    limpieza: 'Limpieza',
};

export const formatearDetalleInsumo = (texto) => {
    if (!texto || !texto.includes('|')) return texto || '';

    return texto
        .split(' ; ')
        .map((bloque) => {
            const [categoria, , cantidad, unidad] = bloque.split('|');
            const nombre = NOMBRE_CATEGORIA_INSUMO[categoria?.trim()] || categoria?.trim() || 'Insumo';
            return `${nombre} · ${cantidad?.trim() || 1} ${unidad?.trim() || 'unidades'}`;
        })
        .join(', ');
};

export const getMisDonaciones = async () => {
    try {
        const response = await axios.get('/donacion/mis-donaciones');
        return response.data;
    } catch (error) {
        return error.response?.data || { status: 'Error', message: 'Error de conexión con el servidor.' };
    }
};

export const descargarComprobante = (datos) => {
    if (!datos) return;
    const esInsumo = datos.categoriaDonacion === 'Insumo';
    const montoFormateado = Number(datos.monto || 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
    const fechaFormateada = (datos.fecha || datos.confirmadoEn || datos.fechaTransaccion)
        ? new Date(datos.fecha || datos.confirmadoEn || datos.fechaTransaccion).toLocaleString('es-CL', { timeZone: 'America/Santiago' })
        : new Date().toLocaleString('es-CL', { timeZone: 'America/Santiago' });

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    doc.setFillColor(198, 90, 52);
    doc.rect(0, 0, 210, 34, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('HOGAR DE MASCOTAS', 18, 16);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Comprobante oficial de aporte y donación', 18, 24);

    doc.setTextColor(53, 46, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(`Comprobante de Donación #${datos.donacionId}`, 18, 48);

    doc.setFillColor(230, 242, 236);
    doc.roundedRect(150, 40, 42, 10, 3, 3, 'F');
    doc.setTextColor(72, 108, 93);
    doc.setFontSize(10);
    doc.text(String(datos.estado || 'Completado').toUpperCase(), 171, 46.5, { align: 'center' });

    const filas = [
        ['Fecha de confirmación', fechaFormateada],
        ['Donante', datos.nombreDonante || 'Usuario'],
        ...(datos.rutDonante ? [['RUT', datos.rutDonante]] : []),
        ['Correo', datos.correoDonante || 'No especificado'],
        ['Categoría', esInsumo ? 'Donación de Insumos' : 'Aporte Económico'],
        ...(esInsumo
            ? [['Detalle de insumos', formatearDetalleInsumo(datos.detalleInsumo)]]
            : [
                ['Modalidad', datos.modalidad === 'Mensual' ? 'Suscripción mensual' : 'Donación única'],
                ['Destino', datos.animal ? `Apadrinamiento de ${datos.animal}` : 'Fondo general del refugio'],
                ['Monto aportado', `${montoFormateado} CLP`],
            ]),
    ];

    let y = 62;
    doc.setDrawColor(229, 221, 213);
    filas.forEach(([etiqueta, valor], idx) => {
        if (idx % 2 === 0) {
            doc.setFillColor(250, 247, 242);
            doc.rect(18, y - 6, 174, 11, 'F');
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(94, 82, 75);
        doc.text(etiqueta, 22, y + 1);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(31, 41, 55);
        doc.text(String(valor), 78, y + 1, { maxWidth: 110 });
        doc.line(18, y + 5, 192, y + 5);
        y += 12;
    });

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(72, 108, 93);
    doc.text('Muchas gracias por apoyar el cuidado y bienestar de nuestros animales rescatados.', 105, y + 14, { align: 'center' });

    doc.save(`comprobante-donacion-${datos.donacionId}.pdf`);
};
