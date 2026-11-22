"use strict";

import nodemailer from "nodemailer";

export async function enviarCorreoDecisionVoluntario(voluntario, estado) {
  if (!["Aprobado", "Rechazado"].includes(estado)) {
    throw new Error("Estado no válido para notificación.");
  }

  if (!voluntario?.email) {
    throw new Error("El voluntario no tiene correo electrónico.");
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    throw new Error("Falta configurar el correo SMTP.");
  }

  const transportador = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const aprobado = estado === "Aprobado";

  const asunto = aprobado
    ? "¡Tu solicitud de voluntariado fue aprobada!"
    : "Resultado de tu solicitud de voluntariado";

  const mensaje = aprobado
    ? `Hola ${voluntario.nombreCompleto}:

¡Felicitaciones!

Nos alegra informarte que tu solicitud para formar
parte de Hogar de Mascotas ha sido APROBADA.

Próximamente recibirás las instrucciones para
crear tu cuenta de voluntario.

Muchas gracias por querer formar parte de
nuestro equipo.

Atentamente,
Equipo Hogar de Mascotas`
    : `Hola ${voluntario.nombreCompleto}:

Gracias por tu interés en formar parte
de Hogar de Mascotas.

Lamentamos informarte que tu solicitud
de voluntariado no ha sido seleccionada
en esta oportunidad.

Agradecemos tu disposición y el tiempo
que dedicaste a postular.

Atentamente,
Equipo Hogar de Mascotas`;

  const informacion = await transportador.sendMail({
    from: {
      name: "Hogar de Mascotas",
      address: process.env.SMTP_USER,
    },
    to: voluntario.email,
    subject: asunto,
    text: mensaje,
  });

  return {
    enviado: true,
    messageId: informacion.messageId,
  };
}
