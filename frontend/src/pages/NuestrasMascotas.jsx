import { useEffect, useState } from 'react';
import MascotaCard from '../components/MascotaCard.jsx';
import { getMascotas } from '../services/mascota.service';

import '../styles/home.css';

const NuestrasMascotas = () => {
  const [mascotas, setMascotas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getMascotas()
      .then(setMascotas)
      .catch(() => setError("No se pudieron cargar las mascotas."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Cargando mascotas...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="container">
      <h1>Nuestras Mascotas</h1>
      <div className="mascotas-grid">
        {mascotas.map((mascota) => (
          <MascotaCard key={mascota.mascota_id} mascota={mascota} />
        ))}
      </div>
    </div>
  );
};

export default NuestrasMascotas;