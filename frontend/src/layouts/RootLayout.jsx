import { Outlet } from "react-router-dom";
import '../styles/navbar.css';

const NAV = ["Inicio", "Mascotas", "Adopciones", "Voluntarios", "Eventos", "Donaciones"];

export default function RootLayout() {
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
            {NAV.map((item, i) => (
              <a key={item} href="#" className={`nav-link ${i === 0 ? "active" : ""}`}>
                {item}
              </a>
            ))}
          </nav>

          <div className="nav-controls">
            <button className="btn-nav-icon">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <div className="avatar">
              <img/>
            </div>
          </div>

        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}