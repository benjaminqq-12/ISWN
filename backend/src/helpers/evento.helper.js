export const fechaActual = () => {
    const partes = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Santiago", year: "numeric", month: "2-digit", day: "2-digit"
    }).formatToParts(new Date());
    const valor = (tipo) => partes.find(parte => parte.type === tipo).value;
    return `${valor("year")}-${valor("month")}-${valor("day")}`;
};

export const validarHorarioEvento = (evento) => {
    if (evento.fechaEvento < fechaActual()) return "La fecha del evento no puede estar en el pasado.";
    if (!evento.horaFin) return "Debes indicar la hora de término del evento.";
    if (evento.horaFin <= evento.horaInicio) return "La hora de término debe ser posterior al inicio, dentro del mismo día.";
    return null;
};

export const eventoTermino = (evento, ahora = new Date()) => {
    const partes = new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Santiago", 
        year: "numeric", 
        month: "2-digit", 
        day: "2-digit",
        hour: "2-digit", 
        minute: "2-digit", 
        hourCycle: "h23"
    }).formatToParts(ahora);
    const valor = tipo => partes.find(parte => parte.type === tipo).value;
    const fecha = `${valor("year")}-${valor("month")}-${valor("day")}`;
    const hora = `${valor("hour")}:${valor("minute")}`;
    return evento.fechaEvento < fecha
        || (evento.fechaEvento === fecha && Boolean(evento.horaFin) && evento.horaFin <= hora);
};
