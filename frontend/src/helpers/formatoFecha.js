export const fechaLocal = (fechaTexto) => {
    if (!fechaTexto) return null;

    const fechaLimpia = String(fechaTexto).split('T')[0];
    const [anio, mes, dia] = fechaLimpia.slice(0, 10).split('-').map(Number);
    if(!anio || !mes || !dia) return null;
    const fecha = new Date(anio, mes - 1, dia, 12);

    if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes - 1 || fecha.getDate() !== dia) 
    return null;

    return fecha;
};

export const fechaActualChile = () => {
    const partes = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date());
    const valor = (tipo) => partes.find(parte => parte.type === tipo).value;
    return `${valor('year')}-${valor('month')}-${valor('day')}`;
};
