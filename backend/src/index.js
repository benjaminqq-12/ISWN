"use strict";

import express, { json, urlencoded } from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import path from "path";
import { fileURLToPath } from "url";

// importando configuraciones
import indexRoutes from "./routes/index.routes.js";
import { cookieKey, HOST, PORT } from "./config/configEnv.js";
import { connectDB } from "./config/configDb.js";
import { passportJwtSetup } from "./auth/passport.auth.js";
import { 
  createUsuarios, 
  createAnimales, 
  createVoluntarios 
} from "./config/initialSetup.js";

const app = express();

//configuracion de express
function configureApp() {
  app.disable("x-powered-by");
  
  app.use(cors({ credentials: true, origin: true }));
  app.use(urlencoded({ extended: true, limit: "1mb" }));
  app.use(json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(morgan("dev"));
  
  app.use(session({
    secret: cookieKey,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, sameSite: "strict" },
  }));

  app.use(passport.initialize());
  app.use(passport.session());
  passportJwtSetup();

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  app.use("/uploads", express.static(path.join(__dirname, "uploads")));
  
  app.use("/api", indexRoutes);
}

// funcion arranque
async function startServer() {
  try {
    await connectDB();

    await createUsuarios();
    await createAnimales();
    await createVoluntarios();

    configureApp();
    
    app.listen(PORT, () => {
      console.log(`=> Servidor corriendo en ${HOST}:${PORT}/api`);
      console.log("=> API Iniciada exitosamente");
    });

  } catch (error) {
    console.error("Error crítico al iniciar la API:", error);
  }
}

startServer();