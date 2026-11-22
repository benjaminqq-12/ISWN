"use strict";

import "dotenv/config";
import nodemailer from "nodemailer";

async function probarCorreo() {
  try {
    const transportador = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    const resultado = await transportador.sendMail({
      from: {
        name: "Hogar de Mascotas",
        address: process.env.SMTP_USER,
      },
      to: process.env.SMTP_USER,
      subject: "Prueba de correo - ISWN",
      text: "¡Hola! Este es un correo de prueba enviado desde el backend de ISWN utilizando Nodemailer.",
    });

    console.log("Correo aceptado por el servidor SMTP.");
    console.log("ID del mensaje:", resultado.messageId);
  } catch (error) {
    console.error("Error al enviar el correo:", error.message);
  }
}

probarCorreo();
