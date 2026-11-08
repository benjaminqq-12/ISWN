export const celdaCSV = (valor) => {
    let texto = String(valor ?? "");
    if (/^[\s]*[=+@-]/.test(texto) || /^[\t\r\n]/.test(texto)) {
        texto = "'" + texto;
    }
    return `"${texto.replaceAll('"', '""')}"`;
};

export const construirCSV = (filas) =>
    "\uFEFF" + filas.map((fila) => fila.map(celdaCSV).join(";")).join("\r\n");
