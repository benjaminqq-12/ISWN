export const fechaLocal = (fechaIso) => {
    if (!fechaIso || typeof fechaIso !== 'string') return null;

    const [anio, mes, dia] = fechaIso.slice(0, 10).split('-').map(Number);
    const fecha = new Date(anio, mes - 1, dia, 12);

    if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes - 1 || fecha.getDate() !== dia) {
        return null;
    }

    return fecha;
};
