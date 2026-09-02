"use strict";
import express, { json, urlencoded } from "express";
import cors from "cors";
import morgan from "morgan";
import { cookieKey, HOST, PORT } from "./config/configEnv.js";

// import { connectDB } from "./config/configDb.js";
// import indexRoutes from "./routes/index.routes.js";


async function setupServer() {
    try{
        const app = express();
        app.disable("x-powered-by");

        // 1. Middlewares
        app.use(cors({ credentials: true, origin: true }));
        app.use(morgan("dev"));
        app.use(json({ limit: "1mb" }));
        app.use(urlencoded({ extended: true, limit: "1mb" }));


        app.listen(PORT, () => {
            console.log(`=> Servidor corriendo en ${HOST}:${PORT}/api`);
        });

    }catch(error){
        console.log("Error en SetupServer:", error);
    }



}



