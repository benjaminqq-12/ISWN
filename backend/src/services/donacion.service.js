import { In, LessThan } from "typeorm";
import { AppDataSource } from "../config/configDb.js";
import DonacionSchema from "../entity/donacion.entity.js";
import SuscripcionSchema from "../entity/suscripcionDonacion.entity.js";
import MascotaSchema from "../entity/mascota.entity.js";
import InventarioSchema from "../entity/inventario.entity.js";
import MovimientoInventarioSchema from "../entity/movimientoInventario.entity.js";
import { generarContenidoCSV } from "../helpers/donacion.helper.js";
import { enviarCorreoBoletaDonacion } from "./email.service.js";

// Elimina las solicitudes pendientes que llevan más de 2 días (48 horas) sin completarse
async function limpiarPendientesVencidas() {
    try {
        const donacionRepository = AppDataSource.getRepository(DonacionSchema);
        const suscripcionRepository = AppDataSource.getRepository(SuscripcionSchema);

        const fechaLimite = new Date();
        fechaLimite.setHours(fechaLimite.getHours() - 48);

        await donacionRepository.delete({
            estado: "Pendiente",
            fechaTransaccion: LessThan(fechaLimite),
        });
        await suscripcionRepository.delete({
            estado: "Pendiente",
            creadoEn: LessThan(fechaLimite),
        });
    } catch (error) {
        console.error("Error en limpiarPendientesVencidas:", error);
    }
}

export const obtenerAnimalesApadrinablesService = async () => {
    try {
        const mascotaRepository = AppDataSource.getRepository(MascotaSchema);

        const animales = await mascotaRepository.find({
            where: { mascota_estado: "En Refugio" },
            order: { mascota_nombreCompleto: "ASC" },
            select: {
                mascota_id: true,
                mascota_nombreCompleto: true,
                mascota_especie: true,
                mascota_fotoURL: true,
            },
        });

        return [animales, null];
    } catch (error) {
        console.error("Error en obtenerAnimalesApadrinablesService:", error);
        return [null, "Error interno al obtener los animales disponibles."];
    }
};

export const procesarDonacionService = async (datosDonacion, usuarioId) => {
    try {
        await limpiarPendientesVencidas();

        const { categoriaDonacion, modalidad, monto, detalleInsumo, mensaje, animalId, animalIds } = datosDonacion;

        const donacionRepository = AppDataSource.getRepository(DonacionSchema);
        const suscripcionRepository = AppDataSource.getRepository(SuscripcionSchema);
        const mascotaRepository = AppDataSource.getRepository(MascotaSchema);

        // Validar que el usuario no tenga ya una donación pendiente sin transferir/entregar
        const pendienteActiva = await donacionRepository.findOne({
            where: {
                usuario: { usuarioId },
                estado: "Pendiente",
            },
        });

        if (pendienteActiva) {
            return [null, `Ya tienes una donación pendiente de verificación (Donación #${pendienteActiva.donacionId}). Completa la entrega/transferencia o espera a que el administrador la revise antes de registrar otra.`];
        }

        const esInsumo = categoriaDonacion === "Insumo";
        const listaAnimalIds = Array.isArray(animalIds) && animalIds.length > 0
            ? [...new Set(animalIds.map(Number))]
            : animalId
                ? [Number(animalId)]
                :[];

        let animalesApadrinados = [];

        if (!esInsumo && listaAnimalIds.length > 0) {
            animalesApadrinados = await mascotaRepository.find({
                where: { mascota_id: In(listaAnimalIds) },
            });

            const todosEnRefugio =
                animalesApadrinados.length === listaAnimalIds.length &&
                animalesApadrinados.every((animal) => animal.mascota_estado === "En Refugio");

            if (!todosEnRefugio) {
                return [null, "Solo puedes apadrinar animales que se encuentren en estado 'En Refugio'."];
            }

            const suscripcionExistente = await suscripcionRepository.findOne({
                where: {
                    usuario: { usuarioId },
                    animal: { mascota_id: In(listaAnimalIds) },
                    estado: In(["Activo", "Pendiente"])
                },
                relations: { animal: true }
            });

            if (suscripcionExistente) {
                const nombreMascota = suscripcionExistente.animal?.mascota_nombreCompleto || "este animal";
                if (suscripcionExistente.estado === "Activo") {
                    return [null, `Ya eres padrino de ${nombreMascota}`];
                }
                return [null, `Ya tienes una solicitud de apadrinamiento pendiente para ${nombreMascota}.`];
            }
        }

        // Caso 1: Donación de Insumos o Donación Única de Dinero
        if (esInsumo || modalidad === "Unica") {
            const nuevaDonacion = donacionRepository.create({
                modalidad: "Unica",
                categoriaDonacion: esInsumo ? "Insumo" : "Dinero",
                monto: esInsumo ? 0 : monto,
                detalleInsumo: esInsumo ? detalleInsumo : null,
                mensaje: mensaje || "",
                apadrinado: false,
                estado: "Pendiente",
                confirmadoEn: null,
                reciboEstado: "Pendiente",
                usuario: { usuarioId },
                animal: null,
            });

            const donacionGuardada = await donacionRepository.save(nuevaDonacion);
            return [{ donacionId: donacionGuardada.donacionId }, null];
        }

        if (animalesApadrinados.length === 0) {
            const nuevaSuscripcion = suscripcionRepository.create({
                monto,
                mensaje: mensaje || "",
                estado: "Pendiente",
                usuario: { usuarioId },
                animal: null,
            });
            const suscripcionGuardada = await suscripcionRepository.save(nuevaSuscripcion);

            const primeraCuota = donacionRepository.create({
                modalidad: "Mensual",
                categoriaDonacion: "Dinero",
                monto,
                detalleInsumo: null,
                mensaje: mensaje || "",
                apadrinado: false,
                estado: "Pendiente",
                confirmadoEn: null,
                reciboEstado: "Pendiente",
                usuario: { usuarioId },
                animal: null,
                suscripcion: { suscripcionId: suscripcionGuardada.suscripcionId },
            });
            const cuotaGuardada = await donacionRepository.save(primeraCuota);
            return [{ donacionId: cuotaGuardada.donacionId }, null];
        }

        const cuotasGuardadas = [];
        for (const animal of animalesApadrinados) {
            const nuevaSuscripcion = suscripcionRepository.create({
                monto,
                mensaje: mensaje || "",
                estado: "Pendiente",
                usuario: { usuarioId },
                animal: { mascota_id: animal.mascota_id },
            });
            const suscripcionGuardada = await suscripcionRepository.save(nuevaSuscripcion);

            const primeraCuota = donacionRepository.create({
                modalidad: "Mensual",
                categoriaDonacion: "Dinero",
                monto,
                detalleInsumo: null,
                mensaje: mensaje || "",
                apadrinado: true,
                estado: "Pendiente",
                confirmadoEn: null,
                reciboEstado: "Pendiente",
                usuario: { usuarioId },
                animal: { mascota_id: animal.mascota_id },
                suscripcion: { suscripcionId: suscripcionGuardada.suscripcionId },
            });
            const cuotaGuardada = await donacionRepository.save(primeraCuota);
            cuotasGuardadas.push(cuotaGuardada);
        }

        return [{
                donacionId: cuotasGuardadas[0].donacionId,
                donacionesIds: cuotasGuardadas.map((c) => c.donacionId),
            },
            null,
        ];

    } catch (error) {
        console.error("Error en procesarDonacionService:", error);
        return [null, "Error interno al procesar la donación en la base de datos."];
    }
};

export const confirmarDonacionService = async (donacionId) => {
    try {
        await limpiarPendientesVencidas();

        const donacionRepository = AppDataSource.getRepository(DonacionSchema);
        const suscripcionRepository = AppDataSource.getRepository(SuscripcionSchema);
        const inventarioRepository = AppDataSource.getRepository(InventarioSchema);
        const movimientoRepository = AppDataSource.getRepository(MovimientoInventarioSchema);

        const donacion = await donacionRepository.findOne({
            where: { donacionId },
            relations: { 
                suscripcion: true, 
                animal: true,
                usuario: true
            },
        });

        if (!donacion) {
            return [null, "La donación no existe o ya expiró por superar las 48 horas."];
        }

        if (donacion.estado === "Completado") {
            return [donacion, null];
        }

        donacion.estado = "Completado";
        donacion.confirmadoEn = new Date();
        donacion.reciboEstado = "Emitido";
        await donacionRepository.save(donacion);
        
        if (donacion.categoriaDonacion === "Insumo" && donacion.detalleInsumo) {
            const PREFIJO_NOMBRE = {
                comida: "AlimentoD",
                medicamentos: "MedicamentoD",
                limpieza: "LimpiezaD",
            };

            const entradas = donacion.detalleInsumo
                .split(" ; ")
                .map((item) => item.trim())
                .filter(Boolean);

            for (const entrada of entradas) {
                const [categoriaRaw, subcategoriaRaw, cantidadRaw, unidadRaw, descripcionRaw] = entrada.split("|");
                const categoria = (categoriaRaw || "comida").trim();
                const subcategoria = categoria === "comida" ? (subcategoriaRaw || "perros").trim() : null;
                const cantidad = Math.max(1, Number(cantidadRaw) || 1);
                const unidad = categoria === "comida" ? "kg" : (unidadRaw || "unidades").trim();
                const descripcion = (descripcionRaw || `Donación #${donacion.donacionId}`).trim();

                const prefijo = PREFIJO_NOMBRE[categoria] || "InsumoD";
                const existentesMismoTipo = await inventarioRepository.count({
                    where: { categoria },
                });
                const nombreCorrelativo = `${prefijo}-${existentesMismoTipo + 1}`;

                const nuevoItem = inventarioRepository.create({
                    nombre: nombreCorrelativo,
                    categoria,
                    subcategoria,
                    unidad,
                    descripcion,
                    stock: cantidad,
                    stockMinimo: 0,
                });
                const inventarioGuardado = await inventarioRepository.save(nuevoItem);

                const nuevoMovimiento = movimientoRepository.create({
                    tipo: "entrada",
                    cantidad,
                    motivo: `Donación #${donacion.donacionId}: ${descripcion}`,
                    inventario: { inventarioId: inventarioGuardado.inventarioId },
                    usuario: administradorId ? { usuarioId: administradorId } : null,
                    donacion: { donacionId: donacion.donacionId },
                });
                await movimientoRepository.save(nuevoMovimiento);
            }
        }

        if (donacion.suscripcion) {
            const suscripcion = await suscripcionRepository.findOne({
                where: { suscripcionId: donacion.suscripcion.suscripcionId },
            });

            if (suscripcion && suscripcion.estado === "Pendiente") {
                suscripcion.estado = "Activo";
                await suscripcionRepository.save(suscripcion);
            }
        }

        await enviarCorreoBoletaDonacion(donacion);
        return [donacion, null];
    } catch (error) {
        console.error("Error en confirmarDonacionService:", error);
        return [null, "Error interno al confirmar la donación."];
    }
};

export const eliminarDonacionPendienteService = async (donacionId) => {
    try {
        const donacionRepository = AppDataSource.getRepository(DonacionSchema);
        const suscripcionRepository = AppDataSource.getRepository(SuscripcionSchema);

        const donacion = await donacionRepository.findOne({
            where: { donacionId },
            relations: { suscripcion: true },
        });

        if (!donacion) return [null, "La donación no existe."];
        if (donacion.estado === "Completado") {
            return [null, "No se puede eliminar una donación que ya fue confirmada."];
        }

        const suscripcionId = donacion.suscripcion?.suscripcionId;
        await donacionRepository.remove(donacion);

        if (suscripcionId) {
            const suscripcion = await suscripcionRepository.findOne({
                where: { suscripcionId },
            });
            if (suscripcion && suscripcion.estado === "Pendiente") {
                await suscripcionRepository.remove(suscripcion);
            }
        }

        const resCorreo = await enviarCorreoBoletaDonacion(donacion);
        console.log("[EMAIL RESULTADO]", resCorreo);

        return [true, null];
    } catch (error) {
        console.error("Error en eliminarDonacionPendienteService:", error);
        return [null, "Error interno al descartar la donación pendiente."];
    }
};

export const obtenerMisDonacionesService = async (usuarioId) => {
    try {
        await limpiarPendientesVencidas();

        const donacionRepository = AppDataSource.getRepository(DonacionSchema);
        const suscripcionRepository = AppDataSource.getRepository(SuscripcionSchema);

        const misDonaciones = await donacionRepository.find({
            where: { usuario: { usuarioId } },
            relations: { animal: true, usuario: true },
            order: { fechaTransaccion: "DESC", donacionId: "DESC" },
        });

        const misSuscripciones = await suscripcionRepository.find({
            where: { usuario: { usuarioId }, estado: "Activo" },
            relations: { animal: true, usuario: true },
            order: { creadoEn: "DESC" },
        });

        const formateadas = misDonaciones.map((item) => {
            const venceEn = new Date(item.fechaTransaccion);
            venceEn.setHours(venceEn.getHours() + 48);
            return {
                donacionId: item.donacionId,
                nombreDonante: item.usuario?.usuarioNombre || "Usuario",
                correoDonante: item.usuario?.usuarioEmail || "",
                rutDonante: item.usuario?.rut || "",
                categoriaDonacion: item.categoriaDonacion,
                detalleInsumo: item.detalleInsumo,
                monto: item.monto,
                modalidad: item.modalidad,
                fechaTransaccion: item.fechaTransaccion,
                confirmadoEn: item.confirmadoEn,
                fecha: item.confirmadoEn || item.fechaTransaccion,
                venceEn,
                animalId: item.animal?.mascota_id || null,
                animal: item.animal?.mascota_nombreCompleto || null,
                estado: item.estado,
                reciboEstado: item.reciboEstado,
            };
        });

        const datos = {
            ultimaDonacion: formateadas[0] || null,
            pendientes: formateadas.filter((item) => item.estado === "Pendiente"),
            confirmadas: formateadas.filter((item) => item.estado === "Completado"),
            suscripciones: misSuscripciones.map((item) => ({
                suscripcionId: item.suscripcionId,
                monto: item.monto,
                creadoEn: item.creadoEn,
                animalId: item.animal?.mascota_id || null,
                animal: item.animal?.mascota_nombreCompleto || null,
                estado: item.estado,
            })),
        };

        return [datos, null];
    } catch (error) {
        console.error("Error en obtenerMisDonacionesService:", error);
        return [null, "Error interno al obtener tus donaciones."];
    }
};


export const obtenerEstadoAporteService = async (donacionId) => {
    try {
        await limpiarPendientesVencidas();

        const donacionRepository = AppDataSource.getRepository(DonacionSchema);

        const donacion = await donacionRepository.findOne({
            where: { donacionId },
            relations: { animal: true, usuario: true },
        });

        if (!donacion) return [null, "No se encontró la donación o expiró tras pasar 48 horas sin confirmación."];

        const venceEn = new Date(donacion.fechaTransaccion);
        venceEn.setHours(venceEn.getHours() + 48);

        const resultado = {
            donacionId: donacion.donacionId,
            nombreDonante: donacion.usuario?.usuarioNombre || "Usuario",
            correoDonante: donacion.usuario?.usuarioEmail || "",
            rutDonante: donacion.usuario?.rut || "",
            categoriaDonacion: donacion.categoriaDonacion,
            detalleInsumo: donacion.detalleInsumo,
            estado: donacion.estado,
            modalidad: donacion.modalidad,
            monto: donacion.monto,
            animal: donacion.animal?.mascota_nombreCompleto || null,
            fecha: donacion.confirmadoEn || donacion.fechaTransaccion,
            venceEn,
            reciboEstado: donacion.reciboEstado,
        };

        return [resultado, null];
    } catch (error) {
        console.error("Error en obtenerEstadoAporteService:", error);
        return [null, "Error interno al consultar el estado del aporte."];
    }
};

export const obtenerRecaudacionService = async ({ anio, mes }) => {
    try {
        await limpiarPendientesVencidas();

        const donacionRepository = AppDataSource.getRepository(DonacionSchema);
        const suscripcionRepository = AppDataSource.getRepository(SuscripcionSchema);

        const todasConfirmadas = await donacionRepository.find({
            where: { estado: "Completado" },
            relations: { animal: true, usuario: true },
            order: { confirmadoEn: "DESC", donacionId: "DESC" },
        });

        const listaConfirmadas = todasConfirmadas.filter((donacion) => {
            if (!donacion.confirmadoEn) return false;
            const anioPago = Number(
                new Intl.DateTimeFormat("en-US", { timeZone: "America/Santiago", year: "numeric" }).format(donacion.confirmadoEn)
            );
            const mesPago = Number(
                new Intl.DateTimeFormat("en-US", { timeZone: "America/Santiago", month: "numeric" }).format(donacion.confirmadoEn)
            );
            if (anioPago !== Number(anio)) return false;
            if (mes && mesPago !== Number(mes)) return false;
            return true;
        });

        const listaPendientes = await donacionRepository.find({
            where: { estado: "Pendiente" },
            relations: { animal: true, usuario: true },
            order: { fechaTransaccion: "DESC" },
        });

        const vigentes = await suscripcionRepository.find({
            where: { estado: "Activo" },
            relations: { animal: true, usuario: true },
            order: { creadoEn: "DESC" },
        });

        const resumen = Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, total: 0, cantidad: 0 }));
        for (const donacion of listaConfirmadas) {
            if (donacion.categoriaDonacion === "Insumo") continue;
            const numeroMes = Number(
                new Intl.DateTimeFormat("en-US", { timeZone: "America/Santiago", month: "numeric" }).format(donacion.confirmadoEn)
            );
            resumen[numeroMes - 1].total += donacion.monto;
            resumen[numeroMes - 1].cantidad++;
        }

        const datos = {
            total: listaConfirmadas.reduce((suma, item) => suma + item.monto, 0),
            cantidad: listaConfirmadas.length,
            totalPendientes: listaPendientes.length,
            aporteMensualVigente: vigentes.reduce((suma, item) => suma + item.monto, 0),
            padrinosVigentes: new Set(vigentes.filter((item) => item.animal).map((item) => item.usuario?.usuarioId)).size,
            resumen: mes ? resumen.filter((item) => item.mes === Number(mes)) : resumen,
            pendientes: listaPendientes.map((item) => {
                const venceEn = new Date(item.fechaTransaccion);
                venceEn.setHours(venceEn.getHours() + 48);
                return {
                    donacionId: item.donacionId,
                    nombreDonante: item.usuario?.usuarioNombre || "Usuario",
                    correoDonante: item.usuario?.usuarioEmail || "",
                    rutDonante: item.usuario?.rut || "",
                    categoriaDonacion: item.categoriaDonacion,
                    detalleInsumo: item.detalleInsumo,
                    monto: item.monto,
                    modalidad: item.modalidad,
                    fechaTransaccion: item.fechaTransaccion,
                    venceEn,
                    animal: item.animal?.mascota_nombreCompleto || null,
                    estado: item.estado,
                };
            }),
            donaciones: listaConfirmadas.map((item) => ({
                donacionId: item.donacionId,
                nombreDonante: item.usuario?.usuarioNombre || "Usuario",
                correoDonante: item.usuario?.usuarioEmail || "",
                rutDonante: item.usuario?.rut || "",
                categoriaDonacion: item.categoriaDonacion,
                detalleInsumo: item.detalleInsumo,
                monto: item.monto,
                modalidad: item.modalidad,
                confirmadoEn: item.confirmadoEn,
                estado: item.estado,
                animal: item.animal?.mascota_nombreCompleto || null,
                reciboEstado: item.reciboEstado,
            })),
            suscripciones: vigentes.map((item) => ({
                suscripcionId: item.suscripcionId,
                nombreDonante: item.usuario?.usuarioNombre || "Usuario",
                correoDonante: item.usuario?.usuarioEmail || "",
                rutDonante: item.usuario?.rut || "",
                monto: item.monto,
                creadoEn: item.creadoEn,
                animal: item.animal?.mascota_nombreCompleto || null,
                estado: item.estado,
            })),
        };

        return [datos, null];
    } catch (error) {
        console.error("Error en obtenerRecaudacionService:", error);
        return [null, "Error interno al obtener la recaudación."];
    }
};

export const exportarRecaudacionService = async (filtros) => {
    try {
        const [datos, error_servicio] = await obtenerRecaudacionService(filtros);
        if (error_servicio) return [null, error_servicio];

        const archivoCSV = generarContenidoCSV(datos, filtros);
        return [archivoCSV, null];
    } catch (error) {
        console.error("Error en exportarRecaudacionService:", error);
        return [null, "Error interno al generar el archivo de exportación."];
    }
};

export const desactivarSuscripcionService = async (suscripcionId, administradorId, motivo) => {
    try {
        const suscripcionRepository = AppDataSource.getRepository(SuscripcionSchema);

        const suscripcion = await suscripcionRepository.findOne({
            where: { suscripcionId },
        });

        if (!suscripcion) return [null, "La suscripción no existe."];
        if (suscripcion.estado === "Inactivo") return [{ suscripcionId, estado: "Inactivo" }, null];

        suscripcion.estado = "Inactivo";
        suscripcion.desactivadoEn = new Date();
        suscripcion.motivoDesactivacion = motivo;
        suscripcion.desactivadoPor = { usuarioId: administradorId };

        await suscripcionRepository.save(suscripcion);
        return [{ suscripcionId, estado: suscripcion.estado }, null];
    } catch (error) {
        console.error("Error en desactivarSuscripcionService:", error);
        return [null, "Error interno al desactivar la suscripción."];
    }
};
