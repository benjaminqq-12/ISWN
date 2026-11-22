
"use strict";

import nodemailer from "nodemailer";

export async function enviarCorreoDecisionVoluntario(
  voluntario,
  estado,
  enlaceActivacion = null
) {
  if (!["Aprobado", "Rechazado"].includes(estado)) {
    throw new Error("Estado no válido para notificación.");
  }

  if (!voluntario?.email) {
    throw new Error("El voluntario no tiene correo electrónico.");
  }

  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    throw new Error("Falta configurar el correo SMTP.");
  }

  const aprobado = estado === "Aprobado";

  // Si fue aprobado, debe existir un enlace de activación.
  if (aprobado && !enlaceActivacion) {
    throw new Error("Falta el enlace de activación del voluntario.");
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

  const asunto = aprobado
    ? "¡Tu solicitud de voluntariado fue aprobada!"
    : "Resultado de tu solicitud de voluntariado";

  const mensaje = aprobado
    ? `Hola ${voluntario.nombreCompleto}:

¡Felicitaciones!

Tu solicitud para formar parte de Hogar de Mascotas
ha sido APROBADA.

Para crear tu cuenta de voluntario, ingresa al siguiente enlace:

${enlaceActivacion}

Este enlace es personal y tiene una duración de 24 horas.

Una vez que crees tu cuenta, podrás iniciar sesión
utilizando tu correo electrónico y contraseña.

Muchas gracias por querer formar parte de nuestro equipo.

Atentamente,
Hogar de Mascotas`
    : `Hola ${voluntario.nombreCompleto}:

Gracias por tu interés en formar parte de Hogar de Mascotas.

Lamentamos informarte que tu solicitud de voluntariado
no ha sido seleccionada en esta oportunidad.

Agradecemos tu disposición y el tiempo dedicado.

Atentamente,
Hogar de Mascotas`;

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
