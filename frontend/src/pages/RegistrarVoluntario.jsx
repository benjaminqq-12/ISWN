import { useState } from "react";
import { useOutletContext } from "react-router-dom";

import "../styles/home.css";
import "../styles/voluntarios.css";

const DIAS = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
];

const AREAS_INTERES = [
    "Manejo de perros",
    "Manejo de gatos",
    "Alimentación",
    "Limpieza",
    "Transporte",
    "Apoyo en eventos",
    "Seguimiento de adopciones",
    "Primeros auxilios",
    "Apoyo veterinario",
];

export default function RegistrarVoluntario() {
    const { session } = useOutletContext();

    // Si existe una sesión y el rol es Admin, se habilitan
    // las opciones administrativas.
    const esAdmin = session?.user?.rol === "Admin";

    // Disponibilidad semanal del voluntario.
    const [disponibilidad, setDisponibilidad] = useState(
        Object.fromEntries(
            DIAS.map((dia) => [
                dia,
                {
                    disponible: false,
                    desde: "",
                    hasta: "",
                },
            ])
        )
    );

    function cambiarDisponibilidad(dia, campo, valor) {
        setDisponibilidad((actual) => ({
            ...actual,
            [dia]: {
                ...actual[dia],
                [campo]: valor,
            },
        }));
    }

   async function handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const voluntario = {
        nombreCompleto: formData.get("nombreCompleto"),
        rut: formData.get("rut"),
        fechaNacimiento: formData.get("fechaNacimiento"),
        telefono: formData.get("telefono"),
        email: formData.get("email"),
        direccion: formData.get("direccion"),

        contactoEmergencia: {
            nombre: formData.get("contactoNombre"),
            parentesco: formData.get("contactoParentesco"),
            telefono: formData.get("contactoTelefono"),
        },

        areasInteres: formData.getAll("areasInteres"),

        disponibilidad: disponibilidad,

        transporte: {
            disponibleTraslados:
                formData.get("disponibleTraslados") === "on",

            poseeVehiculo:
                formData.get("poseeVehiculo") === "on",

            tipoVehiculo: formData.get("tipoVehiculo"),
        },

        estado: esAdmin
            ? formData.get("estado")
            : "Pendiente",

        observaciones: esAdmin
            ? formData.get("observaciones")
            : "",
    };

    try {
        const response = await fetch(
            "http://localhost:3000/api/voluntarios",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                },

                body: JSON.stringify(voluntario),
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "No se pudo registrar la postulación."
            );
        }

        alert("Postulación registrada correctamente.");

        console.log("Voluntario registrado:", data);

        form.reset();

        setDisponibilidad(
            Object.fromEntries(
                DIAS.map((dia) => [
                    dia,
                    {
                        disponible: false,
                        desde: "",
                        hasta: "",
                    },
                ])
            )
        );

    } catch (error) {
        console.error("Error al registrar voluntario:", error);

        alert(error.message);
    }
}

    return (
        <div className="container voluntario-page">

            {/* ========================================= */}
            {/* ENCABEZADO */}
            {/* ========================================= */}

            <div className="voluntario-heading">
                <div>
                    <h1>Registrar voluntario</h1>

                    <p>
                        {esAdmin
                            ? "Registra los datos, disponibilidad y antecedentes del voluntario."
                            : "Completa tus datos y disponibilidad para postular como voluntario."}
                    </p>
                </div>

                <span className="voluntario-mode">
                    {esAdmin
                        ? "Registro administrativo"
                        : "Postulación"}
                </span>
            </div>

            <form
                className="voluntario-form"
                onSubmit={handleSubmit}
            >

                {/* ========================================= */}
                {/* INFORMACIÓN PERSONAL */}
                {/* ========================================= */}

                <section className="voluntario-section">
                    <h2>Información personal</h2>

                    <div className="voluntario-grid">

                        <label>
                            Nombre completo *
                            <input
                                name="nombreCompleto"
                                type="text"
                                maxLength="120"
                                required
                            />
                        </label>

                        <label>
                            RUT *
                            <input
                                name="rut"
                                type="text"
                                placeholder="12.345.678-9"
                                maxLength="12"
                                required
                            />
                        </label>

                        <label>
                            Fecha de nacimiento *
                            <input
                                name="fechaNacimiento"
                                type="date"
                                required
                            />
                        </label>

                        <label>
                            Teléfono / WhatsApp *
                            <input
                                name="telefono"
                                type="tel"
                                placeholder="+56 9 1234 5678"
                                required
                            />
                        </label>

                        <label>
                            Correo electrónico *
                            <input
                                name="email"
                                type="email"
                                placeholder="ejemplo@correo.cl"
                                required
                            />
                        </label>

                        <label>
                            Dirección *
                            <input
                                name="direccion"
                                type="text"
                                maxLength="200"
                                required
                            />
                        </label>

                    </div>
                </section>

                {/* ========================================= */}
                {/* CONTACTO DE EMERGENCIA */}
                {/* ========================================= */}

                <section className="voluntario-section">
                    <h2>Contacto de emergencia</h2>

                    <div className="voluntario-grid">

                        <label>
                            Nombre *
                            <input
                                name="contactoNombre"
                                type="text"
                                maxLength="120"
                                required
                            />
                        </label>

                        <label>
                            Parentesco *
                            <input
                                name="contactoParentesco"
                                type="text"
                                placeholder="Ej: Hermano/a"
                                maxLength="50"
                                required
                            />
                        </label>

                        <label>
                            Teléfono *
                            <input
                                name="contactoTelefono"
                                type="tel"
                                placeholder="+56 9 1234 5678"
                                required
                            />
                        </label>

                    </div>
                </section>

                {/* ========================================= */}
                {/* ÁREAS DE INTERÉS */}
                {/* ========================================= */}

                <section className="voluntario-section">
                    <h2>Áreas de interés / experiencia</h2>

                    <div className="intereses-grid">

                        {AREAS_INTERES.map((area) => (
                            <label
                                className="check-option"
                                key={area}
                            >
                                <input
                                    type="checkbox"
                                    name="areasInteres"
                                    value={area}
                                />

                                <span>{area}</span>
                            </label>
                        ))}

                    </div>
                </section>

                {/* ========================================= */}
                {/* DISPONIBILIDAD */}
                {/* ========================================= */}

                <section className="voluntario-section">
                    <h2>Disponibilidad habitual</h2>

                    <p className="section-description">
                        Indica los días y horarios en los que normalmente
                        tienes disponibilidad.
                    </p>

                    <div className="disponibilidad-table">

                        <div className="disponibilidad-header">
                            <span>Día</span>
                            <span>Disponible</span>
                            <span>Desde</span>
                            <span>Hasta</span>
                        </div>

                        {DIAS.map((dia) => {
                            const datos = disponibilidad[dia];

                            return (
                                <div
                                    className="disponibilidad-row"
                                    key={dia}
                                >
                                    <strong>{dia}</strong>

                                    <input
                                        type="checkbox"
                                        checked={datos.disponible}
                                        onChange={(event) =>
                                            cambiarDisponibilidad(
                                                dia,
                                                "disponible",
                                                event.target.checked
                                            )
                                        }
                                    />

                                    <input
                                        type="time"
                                        disabled={!datos.disponible}
                                        value={datos.desde}
                                        onChange={(event) =>
                                            cambiarDisponibilidad(
                                                dia,
                                                "desde",
                                                event.target.value
                                            )
                                        }
                                    />

                                    <input
                                        type="time"
                                        disabled={!datos.disponible}
                                        value={datos.hasta}
                                        onChange={(event) =>
                                            cambiarDisponibilidad(
                                                dia,
                                                "hasta",
                                                event.target.value
                                            )
                                        }
                                    />
                                </div>
                            );
                        })}

                    </div>
                </section>

                {/* ========================================= */}
                {/* TRANSPORTE */}
                {/* ========================================= */}

                <section className="voluntario-section">
                    <h2>Transporte</h2>

                    <div className="transporte-grid">

                        <label className="check-option">
                            <input
                                type="checkbox"
                                name="disponibleTraslados"
                            />

                            <span>
                                Disponible para realizar traslados
                            </span>
                        </label>

                        <label className="check-option">
                            <input
                                type="checkbox"
                                name="poseeVehiculo"
                            />

                            <span>
                                Posee vehículo
                            </span>
                        </label>

                        <label>
                            Tipo de vehículo

                            <input
                                name="tipoVehiculo"
                                type="text"
                                placeholder="Opcional"
                                maxLength="80"
                            />
                        </label>

                    </div>
                </section>

                {/* ========================================= */}
                {/* SECCIÓN EXCLUSIVA DEL ADMINISTRADOR */}
                {/* ========================================= */}

                {esAdmin && (
                    <section className="voluntario-section admin-section">

                        <h2>Información administrativa</h2>

                        <div className="voluntario-grid">

                            <label>
                                Estado del voluntario *

                                <select
                                    name="estado"
                                    defaultValue="Pendiente"
                                    required
                                >
                                    <option value="Pendiente">
                                        Pendiente
                                    </option>

                                    <option value="Activo">
                                        Activo
                                    </option>

                                    <option value="Inactivo temporal">
                                        Inactivo temporal
                                    </option>
                                </select>
                            </label>

                            <label className="voluntario-wide">
                                Observaciones administrativas

                                <textarea
                                    name="observaciones"
                                    rows="4"
                                    maxLength="500"
                                    placeholder="Observaciones opcionales..."
                                />
                            </label>

                        </div>

                    </section>
                )}

                {/* ========================================= */}
                {/* MENSAJE DE POSTULACIÓN PÚBLICA */}
                {/* ========================================= */}

                {!esAdmin && (
                    <div className="postulacion-info">
                        Tu solicitud quedará en estado{" "}
                        <strong>Pendiente</strong>{" "}
                        hasta que sea revisada por un administrador.
                    </div>
                )}

                {/* ========================================= */}
                {/* BOTÓN */}
                {/* ========================================= */}

                <button
                    className="btn-primary"
                    type="submit"
                >
                    {esAdmin
                        ? "Registrar voluntario"
                        : "Enviar postulación"}
                </button>

            </form>
        </div>
    );
}