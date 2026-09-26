import { AppDataSource } from "../config/configDb.js";
import DonacionSchema from "../entity/donacion.entity.js";
import MascotaSchema from "../entity/mascota.entity.js";

export const procesarDonacionService = async (datosDonacion) => {
    try {
        const { monto, categoriaDonacion, apadrinado, estado, fechaTransaccion, detalleInsumo, usuarioId, animalId } = datosDonacion;

        const donacionRepository = AppDataSource.getRepository(DonacionSchema);
        const mascotaRepository = AppDataSource.getRepository(MascotaSchema);

        if (categoriaDonacion === "Dinero") {
            if (!monto || monto <= 2000) {
                return [null, "El monto de la donacion economica debe ser estrictamente mayor a 2000 pesos."];
            }
        } else if (categoriaDonacion === "Insumo") {
            if (!detalleInsumo || detalleInsumo.trim() === "") {
                return [null, "Debe especificar que insumos (comida, medicinas, etc.) esta donando."];
            }
        } else {
            return [null, "Categoria de donacion invalida. Especifique 'Dinero' o 'Insumo'."];
        }

        let animalApadrinado = null;

        if (animalId) {
            animalApadrinado = await mascotaRepository.findOne({
                where: { mascota_id: animalId }
            });

            if (!animalApadrinado) {
                return [null, "El animal seleccionado no existe en nuestros registros."];
            }

            if (animalApadrinado.mascota_estado !== "En Refugio") {
                return [null, `Transaccion denegada: El animal esta en estado '${animalApadrinado.mascota_estado}' y no puede ser apadrinado.`];
            }
        }

        const estadoRegistro = apadrinado ? "Activo" : "Completado";

        const nuevaDonacion = donacionRepository.create({
            categoriaDonacion: categoriaDonacion,
            monto: categoriaDonacion === "Dinero" ? monto : 0,
            detalleInsumo: categoriaDonacion === "Insumo" ? detalleInsumo : null,
            estado: estadoRegistro,
            fechaTransaccion: new Date(),
            usuario: { usuarioId: usuarioId },
            animal: animalId ? { mascota_id: animalId } : null
        });

        const donacionGuardada = await donacionRepository.save(nuevaDonacion);

        return [donacionGuardada, null];
    } catch (error) {
        console.error("Error en procesarDonacionService:", error);
        return [null, "Error interno al procesar la donacion en la base de datos."];
    }
};