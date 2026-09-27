import { AppDataSource }  from "../config/configDb.js";
import DonacionSchema from "../entity/donacion.entity.js";
import AnimalSchema from "../entity/animal.entity.js";

export const procesarDonacionService = async(datosDonacion) => {
    try{
        const { monto, categoriaDonacion, apadrinado, estado, fechaTransaccion, detalleInsumo, usuarioId, animalId } = datosDonacion;

        const donacionRepository = AppDataSource.getRepository(DonacionSchema);
        const animalRepository = AppDataSource.getRepository(AnimalSchema);

        let animalApadrinado = null;

        if(animalId){
            animalApadrinado = await animalRepository.findOne({
                where: { animalId: animalId }
            });

            if(!animalApadrinado){
                return [null, "El animal seleccionado no existe en nuestros registros."];
            }

            if(animalApadrinado.estado !== "Disponible"){
                return [null, `Transaccion denegada: El animal está en estado '${animalApadrinado.estado}' y no puede ser apadrinado.`];
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
            animal: animalId ? { animalId: animalId } : null
        });

        const donacionGuardada = await donacionRepository.save(nuevaDonacion);

        return [donacionGuardada, null];
    }catch(error){
        console.error("Error en procesarDonacionService:", error);
        return [null, "Error interno al procesar la donación en la base de datos."];
    }

};