import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { iniciarSesion } from "../services/mascota.service";
import '../styles/navbar.css';

const NAV = [
  { label: "Inicio", to: "/" },
  { label: "Mascotas", to: "/mascotas" },
  { label: "Adopciones"},
  { label: "Atencion Medica"},
  { label: "Voluntarios"},
  { label: "Donaciones"},
  { label: "Eventos", to: "/eventos" },
];

function cargarSesion() {
  try {
    const sesion = JSON.parse(localStorage.getItem("sesion") || "null");
    return sesion?.token && sesion?.user ? sesion : null;
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
  const location = useLocation();

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
      localStorage.setItem("sesion", JSON.stringify(sesion));
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
    localStorage.removeItem("sesion");
    setSession(null);
  }

  return (
    <div>
      <header className="navbar">
        <div className="container navbar-content">
          
          <div className="nav-brand">
            <div className="nav-logo">H</div>
            <div>
              <div className="nav-title">Huellas sin Hogar</div>
              <div className="nav-subtitle">Refugio de Animales</div>
            </div>
          </div>

          <nav className="nav-links">
            {NAV.map((item) => {
              const active = location.pathname === item.to
                || (item.to === "/mascotas" && location.pathname.startsWith("/mascotas/"));
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`nav-link ${active ? "active" : ""}`}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="nav-controls">
            {session ? (
              <>
                <span className="nav-user">
                  {session.user.usuarioNombre} · {session.user.rol}
                </span>
                <button className="auth-toggle" type="button" onClick={handleLogout}>
                  Cerrar sesión
                </button>
              </>
            ) : (
              <button
                className="auth-toggle"
                type="button"
                onClick={() => {
                  setLoginVisible((visible) => !visible);
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
        <form className="login-panel" onSubmit={handleLogin}>
          <label>
            Correo electrónico
            <input name="usuarioEmail" type="email" autoComplete="username" required />
          </label>
          <label>
            Contraseña
            <input name="usuarioPassword" type="password" autoComplete="current-password" required />
          </label>
          {loginError && <p className="login-error" role="alert">{loginError}</p>}
          <button className="btn-primary" type="submit" disabled={loginLoading}>
            {loginLoading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      )}

      <main>
        <Outlet context={{ session }} />
      </main>
    </div>
  );
}