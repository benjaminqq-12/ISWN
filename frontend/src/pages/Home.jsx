import { ArrowRight, CalendarDays, PawPrint } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../styles/home.css';

export default function Home() {
  return (
    <div className="inicio">
      <div className="container">
        <section className="hero">
          <div>
            <p className="hero-badge">Huellas sin Hogar · Refugio de Animales</p>
            <h1>Un nuevo comienzo <span>los espera.</span></h1>
            <p>
              Conoce a los animales que buscan una familia y acompáñanos en las
              actividades de nuestra comunidad.
            </p>
            <div className="hero-actions">
              <Link className="btn-primary" to="/mascotas">
                Conocer mascotas <ArrowRight aria-hidden="true" />
              </Link>
              <Link className="btn-secondary" to="/eventos">
                <CalendarDays aria-hidden="true" /> Ver eventos
              </Link>
            </div>
          </div>
          <div className="hero-image hero-illustration" aria-hidden="true">
            <PawPrint />
            <span>Adoptar cambia dos vidas.</span>
          </div>
        </section>

        <section className="home-destinos" aria-label="Explora el refugio">
          <Link className="home-destino" to="/mascotas">
            <PawPrint aria-hidden="true" />
            <span>
              <strong>Encuentra a tu compañero</strong>
              <small>Conoce a las mascotas que esperan un hogar.</small>
            </span>
            <ArrowRight aria-hidden="true" />
          </Link>
          <Link className="home-destino" to="/eventos">
            <CalendarDays aria-hidden="true" />
            <span>
              <strong>Participa en la comunidad</strong>
              <small>Descubre las próximas actividades del refugio.</small>
            </span>
            <ArrowRight aria-hidden="true" />
          </Link>
        </section>
      </div>
    </div>
  );
}
