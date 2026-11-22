import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const carpetaDestino = path.join(__dirname, "..", "uploads", "eventos");
fs.mkdirSync(carpetaDestino, { recursive: true });

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, carpetaDestino),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `evento-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
    },
});

const fileFilter = (_req, file, cb) => {
    const permitidos = ["image/jpeg", "image/png", "image/webp"];
    if (permitidos.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Solo se permiten imágenes JPG, PNG o WEBP."));
};

export const uploadImagenEvento = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});


