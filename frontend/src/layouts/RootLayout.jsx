import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { iniciarSesion } from "../services/mascota.service";
import LoginModal from "../components/LoginModal";
import "../styles/navbar.css";

/* =========================================
   OPCIONES DE LA BARRA DE NAVEGACIÓN
========================================= */

const NAV = [
  { label: "Inicio", to: "/" },
  { label: "Mascotas", to: "/mascotas" },
  { label: "Adopciones"},
  { label: "Atención Médica", to: "/atencion-medica" },
  {
    label: "Voluntarios",
    submenu: [
      {
        label: "Registrar voluntario",
        to: "/voluntarios/registrar",
      },
    ],
  },

  { label: "Donaciones"},
  { label: "Eventos", to: "/eventos" },
];

/* =========================================
   RECUPERAR SESIÓN GUARDADA
========================================= */

function cargarSesion() {
  try {
    const sesion = JSON.parse(
      localStorage.getItem("sesion") || "null"
    );

    return sesion?.token && sesion?.user
      ? sesion
      : null;
  } catch (error) {
    console.error(
      "No se pudo recuperar la sesión guardada:",
      error
    );

    return null;
  }
}

/* =========================================
   ROOT LAYOUT
========================================= */

export default function RootLayout() {
  const [session, setSession] = useState(cargarSesion);

  const [loginVisible, setLoginVisible] = useState(false);

  const [loginError, setLoginError] = useState("");

  const [loginLoading, setLoginLoading] = useState(false);

  // Guarda qué menú desplegable está abierto
  const [submenuAbierto, setSubmenuAbierto] = useState(null);

  const location = useLocation();

  /* =========================================
     INICIAR SESIÓN
  ========================================= */

  async function handleLogin(event) {
    event.preventDefault();

    setLoginError("");
    setLoginLoading(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const sesion = await iniciarSesion(
        formData.get("usuarioEmail"),
        formData.get("usuarioPassword")
      );

      localStorage.setItem(
        "sesion",
        JSON.stringify(sesion)
      );

      setSession(sesion);

      setLoginVisible(false);

      form.reset();
    } catch (error) {
      setLoginError(error.message);
    } finally {
      setLoginLoading(false);
    }
  }

  /* =========================================
     CERRAR SESIÓN
  ========================================= */

  function handleLogout() {
    localStorage.removeItem("sesion");

    setSession(null);
  }

  /* =========================================
     ABRIR / CERRAR SUBMENÚ
  ========================================= */

  function toggleSubmenu(label) {
    setSubmenuAbierto((actual) =>
      actual === label ? null : label
    );
  }

  return (
    <div>

      {/* =====================================
          NAVBAR
      ===================================== */}

      <header className="navbar">

        <div className="container navbar-content">

          {/* =================================
              LOGO
          ================================= */}

          <div className="nav-brand">

            <div className="nav-logo">
              H
            </div>

            <div>

              <div className="nav-title">
                Huellas sin Hogar
              </div>

              <div className="nav-subtitle">
                Refugio de Animales
              </div>

            </div>

          </div>

          {/* =================================
              LINKS DE NAVEGACIÓN
          ================================= */}

          <nav className="nav-links">
            {NAV.map((item) => {

              /* =============================
                 LINKS NORMALES
                 Inicio / Mascotas
              ============================= */

              if (item.to) {
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={`nav-link ${
                      location.pathname === item.to
                        || (item.to === "/mascotas" && location.pathname.startsWith("/mascotas/"))
                        ? "active"
                        : ""
                    }`}
                    aria-current={location.pathname === item.to ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                );
              }

              /* =============================
                 MENÚ DESPLEGABLE
                 Voluntarios
              ============================= */

              if (item.submenu) {

                const submenuActivo =
                  item.submenu.some(
                    (subitem) =>
                      location.pathname === subitem.to
                  );

                return (
                  <div
                    className="nav-dropdown"
                    key={item.label}
                  >

                    {/* BOTÓN VOLUNTARIOS */}

                    <button
                      type="button"
                      className={`nav-link nav-dropdown-toggle ${
                        submenuActivo
                          ? "active"
                          : ""
                      }`}
                      aria-haspopup="true"
                      aria-expanded={submenuAbierto === item.label}
                      onClick={() =>
                        toggleSubmenu(item.label)
                      }
                    >

                      {item.label}

                      <span
                        className={`dropdown-arrow ${
                          submenuAbierto === item.label ? "open" : ""
                        }`}
                        aria-hidden="true"
                      />

                    </button>

                    {/* MENÚ QUE APARECE AL HACER CLICK */}

                    {submenuAbierto === item.label && (

                      <div className="nav-dropdown-menu">

                        {item.submenu.map(
                          (subitem) => (

                            <Link
                              key={subitem.label}
                              to={subitem.to}
                              className="nav-dropdown-item"
                              onClick={() =>
                                setSubmenuAbierto(null)
                              }
                            >
                              {subitem.label}
                            </Link>

                          )
                        )}

                      </div>

                    )}

                  </div>
                );
              }

              /* =============================
                 OPCIONES AÚN SIN PÁGINA
              ============================= */

              return (
                <button
                  key={item.label}
                  type="button"
                  className="nav-link nav-placeholder"
                >
                  {item.label}
                </button>
              );

            })}

          </nav>

          {/* =================================
              CONTROLES DE SESIÓN
          ================================= */}

          <div className="nav-controls">

            {session ? (
              <>
                <div className="nav-user" title={`${session.user.usuarioNombre} · ${session.user.rol}`}>
                  <span className="nav-user-avatar" aria-hidden="true">
                    {session.user.usuarioNombre?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                  <span className="nav-user-details">
                    <span className="nav-user-name">{session.user.usuarioNombre}</span>
                    <span className="nav-user-role">{session.user.rol}</span>
                  </span>
                </div>

                <button
                  className="auth-toggle"
                  type="button"
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </button>

              </>
            ) : (

              <button
                className="auth-toggle"
                type="button"
                onClick={() => {

                  setLoginVisible(
                    (visible) => !visible
                  );

                  setLoginError("");

                }}
              >
                Iniciar sesión
              </button>

            )}

          </div>

        </div>

      </header>

      {!session && loginVisible && (
        <LoginModal
          onClose={() => setLoginVisible(false)}
          onSubmit={handleLogin}
          error={loginError}
          loading={loginLoading}
        />
      )}

      {/* =====================================
          CONTENIDO DE LAS PÁGINAS
      ===================================== */}

      <main>

        <Outlet
          context={{
            session,
          }}
        />

      </main>

    </div>
  );
}