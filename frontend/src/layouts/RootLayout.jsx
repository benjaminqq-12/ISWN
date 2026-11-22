
import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { iniciarSesion } from "../services/usuario.service";
import LoginModal from "../components/LoginModal";

import cookies from "js-cookie";
import "../styles/navbar.css";

const opcionesCookies = {
  path: "/",
  sameSite: "Lax",
  secure: window.location.protocol === "https:",
};

const NAV = [
  { label: "Inicio", to: "/" },
  { label: "Mascotas", to: "/mascotas" },
  { label: "Adopciones" },
  { label: "Atención Médica", to: "/atencion-medica" },

  {
    label: "Voluntarios",
    submenu: [
      {
        label: "Registrar voluntario",
        to: "/voluntarios/registrar",
      },
      {
        label: "Solicitudes",
        to: "/voluntarios/solicitudes",
        soloAdmin: true,
      },
    ],
  },

  { label: "Donaciones", to: "/donaciones" },
  { label: "Eventos", to: "/eventos" },

  // Visible solamente para personal interno
  {
    label: "Inventario",
    to: "/inventario",
    interno: true,
  },
];

function cargarSesion() {
  try {
    const token = cookies.get("jwt-auth");
    const usuarioGuardado = cookies.get("usuario-sesion");

    if (!token || !usuarioGuardado) {
      return null;
    }

    const user = JSON.parse(usuarioGuardado);

    return user ? { token, user } : null;
  } catch (error) {
    console.error("No se pudo recuperar la sesión guardada:", error);
    return null;
  }
}

export default function RootLayout() {
  const [session, setSession] = useState(cargarSesion);

  const [loginVisible, setLoginVisible] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [submenuAbierto, setSubmenuAbierto] = useState(null);

  const location = useLocation();

  // Permite identificar si inició sesión un administrador.
  const esAdmin = session?.user?.rol === "Admin";

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

      const vencimiento = new Date(
        Date.now() + 8 * 60 * 60 * 1000
      );

      const opciones = {
        ...opcionesCookies,
        expires: vencimiento,
      };

      cookies.set("jwt-auth", sesion.token, opciones);
      cookies.set(
        "usuario-sesion",
        JSON.stringify(sesion.user),
        opciones
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

  function handleLogout() {
    cookies.remove("jwt-auth", opcionesCookies);
    cookies.remove("usuario-sesion", opcionesCookies);

    setSession(null);
    setSubmenuAbierto(null);
  }

  function toggleSubmenu(label) {
    setSubmenuAbierto((actual) =>
      actual === label ? null : label
    );
  }

  return (
    <div>
      <header className="navbar">
        <div className="container navbar-content">
          <div className="nav-brand">
            <div className="nav-logo">H</div>

            <div>
              <div className="nav-title">
                Hogar de Mascotas
              </div>

              <div className="nav-subtitle">
                Cuidado y adopción responsable
              </div>
            </div>
          </div>

          <nav className="nav-links">
            {NAV.map((item) => {
              // Enlaces normales del menú.
              if (item.to) {
                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={`nav-link ${
                      location.pathname === item.to ||
                      (item.to === "/mascotas" &&
                        location.pathname.startsWith(
                          "/mascotas/"
                        ))
                        ? "active"
                        : ""
                    }`}
                    aria-current={
                      location.pathname === item.to
                        ? "page"
                        : undefined
                    }
                  >
                    {item.label}
                  </Link>
                );
              }

              // Menú desplegable de Voluntarios.
              if (item.submenu) {
                // Oculta las opciones exclusivas de Admin
                // cuando no existe una sesión administrativa.
                const opcionesVisibles = item.submenu.filter(
                  (subitem) =>
                    !subitem.soloAdmin || esAdmin
                );

                const submenuActivo =
                  opcionesVisibles.some(
                    (subitem) =>
                      location.pathname === subitem.to
                  );

                return (
                  <div
                    className="nav-dropdown"
                    key={item.label}
                  >
                    <button
                      type="button"
                      className={`nav-link nav-dropdown-toggle ${
                        submenuActivo ||
                        submenuAbierto === item.label
                          ? "active"
                          : ""
                      }`}
                      aria-haspopup="true"
                      aria-expanded={
                        submenuAbierto === item.label
                      }
                      onClick={() =>
                        toggleSubmenu(item.label)
                      }
                    >
                      {item.label}

                      <span
                        className={`dropdown-arrow ${
                          submenuAbierto === item.label
                            ? "open"
                            : ""
                        }`}
                        aria-hidden="true"
                      />
                    </button>

                    {submenuAbierto === item.label && (
                      <div className="nav-dropdown-menu">
                        {opcionesVisibles.map((subitem) => (
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
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              // Opciones que todavía no tienen ruta.
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

          <div className="nav-controls">
            {session ? (
              <>
                <div
                  className="nav-user"
                  title={`${session.user.usuarioNombre} · ${session.user.rol}`}
                >
                  <span
                    className="nav-user-avatar"
                    aria-hidden="true"
                  >
                    {session.user.usuarioNombre
                      ?.charAt(0)
                      ?.toUpperCase() || "U"}
                  </span>

                  <span className="nav-user-details">
                    <span className="nav-user-name">
                      {session.user.usuarioNombre}
                    </span>

                    <span className="nav-user-role">
                      {session.user.rol}
                    </span>
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

      <main>
        <Outlet
          context={{
            session,
            abrirLogin: () => {
              setLoginError("");
              setLoginVisible(true);
            },
          }}
        />
      </main>
    </div>
  );
}
