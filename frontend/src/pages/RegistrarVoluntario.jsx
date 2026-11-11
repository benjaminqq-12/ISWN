import { useRef, useState } from "react";
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

// Formatea el RUT mientras se escribe, sin modificar su valor numérico.
function formatearRut(valor) {
    const limpio = valor.replace(/[^0-9kK]/g, "").toUpperCase().slice(0, 9);

    if (limpio.length <= 1) return limpio;

    const cuerpo = limpio.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const digitoVerificador = limpio.slice(-1);
    return `${cuerpo}-${digitoVerificador}`;
}

// Comprueba el dígito verificador chileno mediante módulo 11.
function validarRut(valor) {
    const limpio = valor.replace(/[.\-]/g, "").toUpperCase();
    if (!/^\d{7,8}[\dK]$/.test(limpio)) return false;

    const cuerpo = limpio.slice(0, -1);
    const digitoIngresado = limpio.slice(-1);
    let suma = 0;
    let multiplicador = 2;

    for (let i = cuerpo.length - 1; i >= 0; i--) {
        suma += Number(cuerpo[i]) * multiplicador;
        multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }

    const resultado = 11 - (suma % 11);
    const digitoCalculado = resultado === 11 ? "0" : resultado === 10 ? "K" : String(resultado);
    return digitoIngresado === digitoCalculado;
}

// Acepta solo los 8 dígitos que siguen al prefijo chileno +56 9.
function extraerDigitosTelefono(valor) {
    let numeros = String(valor).replace(/\D/g, "");
    if (numeros.startsWith("569")) numeros = numeros.slice(3);
    return numeros.slice(0, 8);
}

function mostrarTelefono(digitos) {
    return `+56 9 ${digitos.slice(0, 4)}${digitos.length > 4 ? " " + digitos.slice(4) : ""}`;
}

// Comprueba el formato básico del correo; no verifica si el buzón existe.
function validarFormatoCorreo(valor) {
    const correo = valor.trim();
    return correo.length <= 120 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

export default function RegistrarVoluntario() {
    const { session } = useOutletContext();

    // Si existe una sesión y el rol es Admin, se habilitan
    // las opciones administrativas.
    const esAdmin = session?.user?.rol === "Admin";

    const [email, setEmail] = useState("");
    const [emailTocado, setEmailTocado] = useState(false);
    const emailInvalido = emailTocado && email.length > 0 && !validarFormatoCorreo(email);
    const [estadoCorreo, setEstadoCorreo] = useState("sin-verificar");
    const [mensajeCorreo, setMensajeCorreo] = useState("");
    const comprobacionCorreo = useRef(0);

    function cambiarEmail(valor) {
        comprobacionCorreo.current += 1;
        setEmail(valor);
        setEstadoCorreo("sin-verificar");
        setMensajeCorreo("");
    }

    async function comprobarEmail() {
        setEmailTocado(true);
        const correo = email.trim().toLowerCase();
        if (!validarFormatoCorreo(correo)) return;

        const solicitud = ++comprobacionCorreo.current;
        setEstadoCorreo("consultando");
        setMensajeCorreo("");

        try {
            const respuesta = await fetch("http://localhost:3000/api/voluntarios/verificar-correo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: correo }),
            });
            const datos = await respuesta.json();
            if (solicitud !== comprobacionCorreo.current) return;
            if (!respuesta.ok) throw new Error(datos.message || "No se pudo comprobar el correo.");

            setEstadoCorreo(datos.existe ? "duplicado" : "disponible");
            setMensajeCorreo(datos.existe ? " Este correo electrónico ya está registrado." : "");
        } catch (error) {
            if (solicitud !== comprobacionCorreo.current) return;
            setEstadoCorreo("error");
            setMensajeCorreo(error.message || "No se pudo comprobar el correo.");
        }
    }


    const [rut, setRut] = useState("");
    const [telefono, setTelefono] = useState("");
    const [contactoTelefono, setContactoTelefono] = useState("");
    const [telefonosTocados, setTelefonosTocados] = useState(false);
    const [rutTocado, setRutTocado] = useState(false);
    const rutInvalido = rutTocado && rut.length > 0 && !validarRut(rut);


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

    // No enviar postulaciones con RUT matemáticamente inválido.
    if (!validarRut(rut)) {
        setRutTocado(true);
        return;
    }


    // Ambos números deben contener exactamente ocho dígitos después de +56 9.
    if (telefono.length !== 8 || contactoTelefono.length !== 8) {
        setTelefonosTocados(true);
        return;
    }

    if (!validarFormatoCorreo(email)) {
        setEmailTocado(true);
        return;
    }
    if (estadoCorreo === "duplicado") {
        setMensajeCorreo("Ya está registrado.");
        return;
    }


    const voluntario = {
        nombreCompleto: formData.get("nombreCompleto"),
        rut: formData.get("rut"),
        telefono: `+569${telefono}`,
        email: email.trim().toLowerCase(),
        direccion: formData.get("direccion"),

        contactoEmergencia: {
            nombre: formData.get("contactoNombre"),
            parentesco: formData.get("contactoParentesco"),
            telefono: `+569${contactoTelefono}`,
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
        setRut("");
        comprobacionCorreo.current += 1;
        setEmail("");
        setEmailTocado(false);
        setEstadoCorreo("sin-verificar");
        setMensajeCorreo("");
        setTelefono("");
        setContactoTelefono("");
        setTelefonosTocados(false);
        setRutTocado(false);

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
                                inputMode="text"
                                autoComplete="off"
                                placeholder="12.345.678-5"
                                maxLength={12}
                                value={rut}
                                onChange={(event) => {
                                    setRut(formatearRut(event.target.value));
                                }}
                                onBlur={() => setRutTocado(true)}
                                aria-invalid={rutInvalido}
                                aria-describedby={rutInvalido ? "rut-error" : undefined}
                                required
                            />
                            {rutInvalido && (
                                <span id="rut-error" role="alert" style={{ color: "#b91c1c", fontSize: "0.875rem" }}>
                                    El RUT no es válido. Revisa el número y su dígito verificador.
                                </span>
                            )}
                        </label>

                        <label>
                            Teléfono / WhatsApp *
                            <input
                                name="telefono"
                                type="tel"
                                inputMode="numeric"
                                autoComplete="tel"
                                value={mostrarTelefono(telefono)}
                                onChange={(event) => setTelefono(extraerDigitosTelefono(event.target.value))}
                                onBlur={() => setTelefonosTocados(true)}
                                maxLength={16}
                                required
                            />
                            {telefonosTocados && telefono.length !== 8 && (
                                <span role="alert" style={{ color: "#b91c1c", fontSize: "0.875rem" }}>
                                    Ingresa los 8 dígitos después de +56 9.
                                </span>
                            )}
                        </label>

                        <label>
                            Correo electrónico *
                            <input
                                name="email"
                                type="email"
                                placeholder="ejemplo@correo.cl"
                                maxLength={120}
                                value={email}
                                onChange={(event) => cambiarEmail(event.target.value)}
                                onBlur={comprobarEmail}
                                aria-invalid={emailInvalido || estadoCorreo === "duplicado"}
                                aria-describedby={emailInvalido ? "email-error" : mensajeCorreo ? "email-estado" : undefined}
                                required
                            />
                            {emailInvalido && (
                                <span id="email-error" role="alert" style={{ color: "#b91c1c", fontSize: "0.875rem" }}>
                                    Ingresa un correo válido, por ejemplo nombre@dominio.cl.
                                </span>
                            )}
                            {mensajeCorreo && (
                                <span id="email-estado" role="status" style={{
                                    color: estadoCorreo === "duplicado" || estadoCorreo === "error" ? "#b91c1c" : "#15803d",
                                    fontSize: "0.875rem"
                                }}>
                                    {mensajeCorreo}
                                </span>
                            )}
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
                                inputMode="numeric"
                                autoComplete="tel"
                                value={mostrarTelefono(contactoTelefono)}
                                onChange={(event) => setContactoTelefono(extraerDigitosTelefono(event.target.value))}
                                onBlur={() => setTelefonosTocados(true)}
                                maxLength={16}
                                required
                            />
                            {telefonosTocados && contactoTelefono.length !== 8 && (
                                <span role="alert" style={{ color: "#b91c1c", fontSize: "0.875rem" }}>
                                    Ingresa los 8 dígitos después de +56 9.
                                </span>
                            )}
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