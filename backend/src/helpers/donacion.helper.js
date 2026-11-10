export const celdaCSV = (valor) => {
    let texto = String(valor ?? "");
    if (/^[\s]*[=+@-]/.test(texto) || /^[\t\r\n]/.test(texto)) {
        texto = "'" + texto;
    }
    return `"${texto.replaceAll('"', '""')}"`;
};

export const construirCSV = (filas) =>
    "\uFEFF" + filas.map((fila) => fila.map(celdaCSV).join(";")).join("\r\n");

export const generarContenidoCSV = (datos, { anio, mes, listado = "donaciones" }) => {
    let filas;

    if (listado === "padrinos") {
        filas = [
            ["Nombre", "Correo", "RUT", "Animal", "Aporte mensual CLP", "Fecha de inicio", "Estado"],
            ...datos.suscripciones
                .filter((item) => item.animal)
                .map((item) => [
                    item.nombreDonante,
                    item.correoDonante,
                    item.rutDonante,
                    item.animal,
                    item.monto,
                    item.creadoEn.toISOString(),
                    item.estado,
                ]),
        ];
    } else if (listado === "resumen") {
        filas = [
            ["Año", "Mes", "Total CLP", "Donaciones Económicas"],
            ...datos.resumen.map((item) => [anio, item.mes, item.total, item.cantidad]),
        ];
    } else {
        filas = [
            ["N°", "Fecha confirmación", "Nombre", "Correo", "RUT", "Categoría", "Monto CLP", "Modalidad", "Destino / Insumos", "Estado"],
            ...datos.donaciones.map((item) => [
                item.donacionId,
                item.confirmadoEn.toISOString(),
                item.nombreDonante,
                item.correoDonante,
                item.rutDonante,
                item.categoriaDonacion,
                item.monto,
                item.modalidad,
                item.categoriaDonacion === "Insumo" ? item.detalleInsumo : item.animal || "Refugio",
                item.estado,
            ]),
        ];
    }

    const nombreArchivo = `${listado}-${anio}${mes ? `-${mes}` : ""}.csv`;
    const contenido = construirCSV(filas);

    return { nombreArchivo, contenido };
};
