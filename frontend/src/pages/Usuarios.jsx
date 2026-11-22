import { useEffect, useState } from 'react';
import CrearUsuarioModal from '../components/CrearUsuarioModal.jsx';
import { getUsuarios } from '../services/usuario.service';

import '../styles/home.css';
import '../styles/solicitudes.css';
import '../styles/usuarios.css';

const CLASE_ROL = {
  Admin: "usr-rol-admin",
  Voluntario: "usr-rol-voluntario",
  Usuario: "usr-rol-usuario",
};

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let vigente = true;

    getUsuarios()
      .then((data) => {
        if (!vigente) return;
        // las cuentas más nuevas primero
        setUsuarios([...data].sort((a, b) => b.usuarioId - a.usuarioId));
        setError(null);
      })
      .catch((err) => {
        if (vigente) setError(err.message);
      })
      .finally(() => {
        if (vigente) setLoading(false);
      });

    return () => {
      vigente = false;
    };
  }, [version]);

  if (loading) return <p className="container">Cargando usuarios...</p>;
  if (error) return <p className="container" role="alert">{error}</p>;

  return (
    <div className="container">
      <div className="usr-header">
        <h1>Usuarios</h1>
        <button type="button" className="btn-primary-sm" onClick={() => setMostrarCrear(true)}>
          Nuevo usuario
        </button>
      </div>

      {mensaje && <p className="usr-mensaje" role="status">{mensaje}</p>}

      <div className="tabla-scroll">
        <table className="solicitudes-tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>RUT</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.usuarioId}>
                <td>{u.usuarioNombre}</td>
                <td>{u.rut}</td>
                <td>{u.usuarioEmail}</td>
                <td>
                  <span className={`sol-badge ${CLASE_ROL[u.rol] ?? ""}`}>{u.rol}</span>
                </td>
                <td>
                  <span className={`sol-badge ${u.activo ? "sol-adoptada" : "sol-cancelada"}`}>
                    {u.activo ? "Activa" : "Inactiva"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mostrarCrear && (
        <CrearUsuarioModal
          onClose={() => setMostrarCrear(false)}
          onSuccess={(creado) => {
            setMostrarCrear(false);
            setMensaje(`Cuenta creada: ${creado.usuarioNombre} (${creado.rol}).`);
            setVersion((v) => v + 1);
          }}
        />
      )}
    </div>
  );
};

export default Usuarios;