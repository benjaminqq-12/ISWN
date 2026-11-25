import nodemailer from "nodemailer";
import { jsPDF } from "jspdf";

const crearTransporter = () => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        return null;
    }

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

const pesos = (valor) => Number(valor || 0).toLocaleString("es-CL", { style: "currency", currency: "CLP" });

const NOMBRE_CATEGORIA_INSUMO = {
    comida: "Comida",
    medicamentos: "Medicamentos",
    limpieza: "Limpieza",
};

const formatearDetalleInsumo = (texto) => {
    if (!texto || !texto.includes("|")) return texto || "";
    return texto
        .split(" ; ")
        .map((bloque) => {
            const [categoria, , cantidad, unidad] = bloque.split("|");
            const nombre = NOMBRE_CATEGORIA_INSUMO[categoria?.trim()] || categoria?.trim() || "Insumo";
            return `${nombre} · ${cantidad?.trim() || 1} ${unidad?.trim() || "unidades"}`;
        })
        .join(", ");
};

const generarBufferBoletaPdf = ({ donacion, nombreDonante, rutDonante, destinatario, fechaConfirmacion, detalleAporte, destino }) => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });

    // Cabecera terracota
    doc.setFillColor(198, 90, 52);
    doc.rect(0, 0, 210, 34, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("HOGAR DE MASCOTAS", 18, 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Comprobante oficial de aporte y donación", 18, 24);

    // Folio y estado
    doc.setTextColor(53, 46, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(`Comprobante de Donación #${donacion.donacionId}`, 18, 48);

    doc.setFillColor(230, 242, 236);
    doc.roundedRect(150, 40, 42, 10, 3, 3, "F");
    doc.setTextColor(72, 108, 93);
    doc.setFontSize(10);
    doc.text(String(donacion.estado || "Completado").toUpperCase(), 171, 46.5, { align: "center" });

    const filas = [
        ["Fecha de confirmación", fechaConfirmacion],
        ["Donante", nombreDonante],
        ["RUT", rutDonante],
        ["Correo", destinatario],
        ["Tipo de donación", donacion.categoriaDonacion],
        ["Detalle", detalleAporte],
        ["Destino", destino],
    ];

    let y = 62;
    doc.setDrawColor(229, 221, 213);
    filas.forEach(([etiqueta, valor], idx) => {
        if (idx % 2 === 0) {
            doc.setFillColor(250, 247, 242);
            doc.rect(18, y - 6, 174, 11, "F");
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(94, 82, 75);
        doc.text(etiqueta, 22, y + 1);

        doc.setFont("helvetica", "normal");
        doc.setTextColor(31, 41, 55);
        doc.text(String(valor), 78, y + 1, { maxWidth: 110 });
        doc.line(18, y + 5, 192, y + 5);
        y += 12;
    });

    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(72, 108, 93);
    doc.text("¡Muchas gracias por apoyar el cuidado y bienestar de nuestros animales rescatados!", 105, y + 14, { align: "center" });

    return Buffer.from(doc.output("arraybuffer"));
};

export const enviarCorreoBoletaDonacion = async (donacion) => {
    try {
        const destinatario = donacion.usuario?.usuarioEmail;
        if (!destinatario) return { enviado: false, motivo: "Sin correo de destinatario" };

        const transporter = crearTransporter();
        if (!transporter) {
            console.warn("[EMAIL] SMTP no configurado en .env. Se omitió envío de boleta #" + donacion.donacionId);
            return { enviado: false, motivo: "SMTP no configurado" };
        }

        const esInsumo = donacion.categoriaDonacion === "Insumo";
        const fechaConfirmacion = new Date(donacion.confirmadoEn || new Date()).toLocaleString("es-CL", {
            timeZone: "America/Santiago",
        });
        const nombreDonante = donacion.usuario?.usuarioNombre || "Donante";
        const rutDonante = donacion.usuario?.rut || "No registrado";

        const detalleAporte = esInsumo
            ? formatearDetalleInsumo(donacion.detalleInsumo)
            : `${pesos(donacion.monto)} (${donacion.modalidad})`;
        const destino = donacion.animal?.mascota_nombreCompleto
            ? `Apadrinamiento de ${donacion.animal.mascota_nombreCompleto}`
            : "Apoyo general al refugio";

        const pdfBuffer = generarBufferBoletaPdf({
            donacion,
            nombreDonante,
            rutDonante,
            destinatario,
            fechaConfirmacion,
            detalleAporte,
            destino,
        });

        await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: destinatario,
            subject: `Comprobante de donación #${donacion.donacionId} - Hogar de Mascotas`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #352E2A; max-width: 600px;">
                    <h2 style="color: #C65A34;">¡Tu donación fue verificada!</h2>
                    <p>Hola <strong>${nombreDonante}</strong>, el administrador confirmó tu aporte. Aquí tienes el resumen de tu boleta:</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                        <tr><td style="padding: 8px; border: 1px solid #e5ddd5;"><strong>N° Comprobante</strong></td><td style="padding: 8px; border: 1px solid #e5ddd5;">#${donacion.donacionId}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #e5ddd5;"><strong>Fecha confirmación</strong></td><td style="padding: 8px; border: 1px solid #e5ddd5;">${fechaConfirmacion}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #e5ddd5;"><strong>Aporte</strong></td><td style="padding: 8px; border: 1px solid #e5ddd5;">${detalleAporte}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #e5ddd5;"><strong>Destino</strong></td><td style="padding: 8px; border: 1px solid #e5ddd5;">${destino}</td></tr>
                    </table>
                    <p>Adjuntamos también tu boleta en formato <code>.pdf</code>. Puedes revisar tus donaciones anteriores en la pestaña <strong>Donaciones</strong>.</p>
                </div>
            `,
            attachments: [
                {
                    filename: `boleta-donacion-${donacion.donacionId}.pdf`,
                    content: pdfBuffer,
                    contentType: "application/pdf",
                },
            ],
        });

        return { enviado: true };
    } catch (error) {
        console.error("Error en enviarCorreoBoletaDonacion:", error);
        return { enviado: false, motivo: error.message };
    }
};

export const enviarCorreoEventoModificado = async ({ destinatarios, eventoAntes, eventoDespues, motivo }) => {
    try {
        const correosValidos = [...new Set((destinatarios || []).filter(Boolean))];
        if (correosValidos.length === 0) return { enviado: false, motivo: "Sin inscritos con correo" };

        const transporter = crearTransporter();
        if (!transporter) {
            console.warn("[EMAIL] SMTP no configurado en .env. Se omitió aviso de cambio del evento #" + eventoDespues.eventoId);
            return { enviado: false, motivo: "SMTP no configurado" };
        }

        const fila = (etiqueta, antes, despues) => {
            const cambio = String(antes ?? "") !== String(despues ?? "");
            const estilo = cambio ? "background-color: #FFF4EC; font-weight: bold;" : "";
            return `
                <tr>
                    <td style="padding: 8px; border: 1px solid #e5ddd5;"><strong>${etiqueta}</strong></td>
                    <td style="padding: 8px; border: 1px solid #e5ddd5;">${antes ?? "-"}</td>
                    <td style="padding: 8px; border: 1px solid #e5ddd5; ${estilo}">${despues ?? "-"}</td>
                </tr>
            `;
        };

        await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            bcc: correosValidos,
            subject: `Actualización en el evento: ${eventoDespues.titulo}`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #352E2A; max-width: 650px;">
                    <h2 style="color: #C65A34;">Se modificó un evento en el que estás inscrito</h2>
                    <p>El organizador actualizó los detalles del evento <strong>${eventoDespues.titulo}</strong>.</p>
                    ${motivo ? `<p><strong>Motivo del cambio:</strong> ${motivo}</p>` : ""}
                    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                        <thead>
                            <tr style="background-color: #FAF7F2;">
                                <th style="padding: 8px; border: 1px solid #e5ddd5; text-align: left;">Campo</th>
                                <th style="padding: 8px; border: 1px solid #e5ddd5; text-align: left;">Antes</th>
                                <th style="padding: 8px; border: 1px solid #e5ddd5; text-align: left;">Después</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${fila("Título", eventoAntes.titulo, eventoDespues.titulo)}
                            ${fila("Fecha", eventoAntes.fechaEvento, eventoDespues.fechaEvento)}
                            ${fila("Horario", `${eventoAntes.horaInicio || ""} - ${eventoAntes.horaFin || ""}`, `${eventoDespues.horaInicio || ""} - ${eventoDespues.horaFin || ""}`)}
                            ${fila("Lugar", eventoAntes.lugar, eventoDespues.lugar)}
                            ${fila("Capacidad", eventoAntes.capacidadMaxima, eventoDespues.capacidadMaxima)}
                            ${fila("Descripción", eventoAntes.descripcion, eventoDespues.descripcion)}
                        </tbody>
                    </table>
                    <p>Si el nuevo horario no te acomoda, puedes cancelar tu inscripción desde la pestaña <strong>Eventos</strong>.</p>
                </div>
            `,
        });

        return { enviado: true, cantidad: correosValidos.length };
    } catch (error) {
        console.error("Error en enviarCorreoEventoModificado:", error);
        return { enviado: false, motivo: error.message };
    }
};

export const enviarCorreoEventoEliminado = async ({ destinatarios, evento }) => {
    try {
        const correosValidos = [...new Set((destinatarios || []).filter(Boolean))];
        if (correosValidos.length === 0) return { enviado: false, motivo: "Sin inscritos con correo" };

        const transporter = crearTransporter();
        if (!transporter) {
            console.warn("[EMAIL] SMTP no configurado en .env. Se omitió aviso de eliminación del evento:", evento.titulo);
            return { enviado: false, motivo: "SMTP no configurado" };
        }

        await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            bcc: correosValidos,
            subject: `Evento cancelado/eliminado: ${evento.titulo}`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #352E2A; max-width: 600px;">
                    <h2 style="color: #C65A34;">Un evento en el que estabas inscrito fue eliminado</h2>
                    <p>Te informamos que el administrador canceló y eliminó la siguiente actividad del refugio:</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
                        <tr><td style="padding: 8px; border: 1px solid #e5ddd5;"><strong>Evento</strong></td><td style="padding: 8px; border: 1px solid #e5ddd5;">${evento.titulo}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #e5ddd5;"><strong>Fecha</strong></td><td style="padding: 8px; border: 1px solid #e5ddd5;">${evento.fechaEvento || "-"}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #e5ddd5;"><strong>Horario</strong></td><td style="padding: 8px; border: 1px solid #e5ddd5;">${evento.horaInicio || "-"} - ${evento.horaFin || "-"}</td></tr>
                        <tr><td style="padding: 8px; border: 1px solid #e5ddd5;"><strong>Lugar</strong></td><td style="padding: 8px; border: 1px solid #e5ddd5;">${evento.lugar || "-"}</td></tr>
                    </table>
                    <p>Lamentamos los inconvenientes. Te invitamos a revisar las próximas actividades disponibles en la pestaña <strong>Eventos</strong>.</p>
                </div>
            `,
        });

        return { enviado: true, cantidad: correosValidos.length };
    } catch (error) {
        console.error("Error en enviarCorreoEventoEliminado:", error);
        return { enviado: false, motivo: error.message };
    }
};