"use strict";
import PDFDocument from "pdfkit";
import { AppDataSource } from "../config/configDb.js";
import SolicitudAdopcionSchema from "../entity/solicitudAdopcion.entity.js";
import HistorialMascotaSchema from "../entity/historialMascota.entity.js";
import { ESTADOS_SOLICITUD, ROLES_AUTORIZADORES } from "../config/estadosSolicitud.js";

const NOMBRE_REFUGIO = "Hogar de Mascotas";

// las fuentes estándar del PDF no incluyen la flecha de los cambios de estado
const limpiar = (texto) => String(texto ?? "").replaceAll("→", "a");

const formatearFecha = (fecha) => {
  if (!fecha) return "—";
  if (fecha instanceof Date) return fecha.toLocaleDateString("es-CL");
  return String(fecha).slice(0, 10).split("-").reverse().join("/");
};

function seccion(doc, titulo) {
  doc.moveDown(0.5);
  doc.fillColor("#000000").font("Helvetica-Bold").fontSize(12).text(titulo);

  const y = doc.y + 2;
  doc
    .moveTo(doc.page.margins.left, y)
    .lineTo(doc.page.width - doc.page.margins.right, y)
    .strokeColor("#cccccc")
    .lineWidth(0.5)
    .stroke();
  doc.y = y + 8;
}

function linea(doc, etiqueta, valor) {
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#000000").text(`${etiqueta}: `, { continued: true });
  doc.font("Helvetica").text(limpiar(valor) || "—");
}

function construirPdf({ solicitud, eventos, incluirNotas }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const partes = [];
    doc.on("data", (parte) => partes.push(parte));
    doc.on("end", () => resolve(Buffer.concat(partes)));
    doc.on("error", reject);

    const mascota = solicitud.solicitudAdopcion_mascotaAdoptada;
    const adoptante = solicitud.solicitudAdopcion_usuarioAdoptante;

    doc.font("Helvetica-Bold").fontSize(18).fillColor("#000000").text(NOMBRE_REFUGIO);
    doc.font("Helvetica").fontSize(10).fillColor("#666666").text("Cuidado y adopción responsable");
    doc.moveDown(1.5);

    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .fillColor("#000000")
      .text(incluirNotas ? "Informe del proceso de adopción" : "Comprobante de adopción");
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#666666")
      .text(`Solicitud #${solicitud.solicitudAdopcion_id}`);

    seccion(doc, "Mascota");
    linea(doc, "Nombre", mascota?.mascota_nombreCompleto);
    linea(doc, "Especie", mascota?.mascota_especie);
    linea(doc, "Sexo", mascota?.mascota_sexo);

    seccion(doc, "Adoptante");
    linea(doc, "Nombre", adoptante?.usuarioNombre);
    linea(doc, "Correo", solicitud.solicitudAdopcion_correo);
    linea(doc, "Teléfono", solicitud.solicitudAdopcion_telefono);

    seccion(doc, "Proceso");
    linea(doc, "Fecha de la solicitud", formatearFecha(solicitud.solicitudAadopcion_fechaSolicitud));
    linea(doc, "Adopción finalizada el", formatearFecha(solicitud.updatedAt));

    seccion(doc, "Línea de tiempo");
    if (eventos.length === 0) {
      doc.font("Helvetica").fontSize(10).fillColor("#000000").text("No hay eventos registrados.");
    }

    eventos.forEach((evento) => {
      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#000000")
        .text(`${formatearFecha(evento.historialMascota_fecha)} · ${limpiar(evento.historialMascota_tipoEvento)}`);

      // las notas internas y el autor solo van en la versión para el personal
      if (incluirNotas) {
        if (evento.historialMascota_descripcion) {
          doc
            .font("Helvetica")
            .fontSize(10)
            .fillColor("#333333")
            .text(limpiar(evento.historialMascota_descripcion), { indent: 12 });
        }
        const autor = evento.historialAdopcion_registradoPorUsuario;
        if (autor) {
          doc
            .font("Helvetica-Oblique")
            .fontSize(9)
            .fillColor("#666666")
            .text(`Registrado por ${limpiar(autor.usuarioNombre)} (${autor.rol})`, { indent: 12 });
        }
      }
      doc.moveDown(0.6);
    });

    doc.moveDown();
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#888888")
      .text(`Documento generado el ${new Date().toLocaleDateString("es-CL")}.`);

    doc.end();
  });
}

export async function generarComprobanteService(solicitudId, usuario) {
  try {
    const solicitudRepository = AppDataSource.getRepository(SolicitudAdopcionSchema);
    const solicitud = await solicitudRepository.findOne({
      where: { solicitudAdopcion_id: solicitudId },
      relations: {
        solicitudAdopcion_mascotaAdoptada: true,
        solicitudAdopcion_usuarioAdoptante: true,
      },
    });
    if (!solicitud) return [null, "La solicitud de adopción no existe."];

    const esPersonal = ROLES_AUTORIZADORES.includes(usuario.rol);
    const esDueno = solicitud.solicitudAdopcion_usuarioAdoptante?.usuarioId === usuario.usuarioId;

    // quien no es personal ni dueño de la solicitud no debe saber que existe
    if (!esPersonal && !esDueno) return [null, "La solicitud de adopción no existe."];

    if (solicitud.solicitudAadopcion_estado !== ESTADOS_SOLICITUD.ADOPTADA) {
      return [null, "El comprobante solo está disponible cuando la adopción está finalizada (estado Adoptada)."];
    }

    const historialRepository = AppDataSource.getRepository(HistorialMascotaSchema);
    const eventos = await historialRepository.find({
      where: { historialAdopcion_solicitudAdopcion: { solicitudAdopcion_id: solicitudId } },
      relations: { historialAdopcion_registradoPorUsuario: true },
      order: { historialMascota_fecha: "ASC", historialMascota_id: "ASC" },
    });

    const pdf = await construirPdf({ solicitud, eventos, incluirNotas: esPersonal });
    return [pdf, null];
  } catch (error) {
    console.error("Error al generar el comprobante de adopción:", error);
    return [null, "Error interno del servidor"];
  }
}