import { Link } from 'react-router-dom';

export default function Error404() {
  return (
    <div className="pagina-error">
      <p>404</p>
      <h1>No encontramos esta página</h1>
      <Link to="/" className="boton boton-primario">Volver al inicio</Link>
    </div>
  );
}
