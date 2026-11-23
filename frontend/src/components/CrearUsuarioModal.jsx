import { useState } from 'react';
import { crearUsuario } from '../services/usuario.service';
import '../styles/mascotas.css';
import '../styles/usuarios.css';

// Debe coincidir con ROLES_CREABLES_POR_ADMIN del backend (src/config/roles.js)
const ROLES = ["Usuario", "Voluntario", "Admin"];

const CrearUsuarioModal = ({ onClose, onSuccess }) => {
  const [rut, setRut] = useState('');
  const [usuarioNombre, setUsuarioNombre] = useState('');
  const [usuarioEmail, setUsuarioEmail] = useState('');
  const [usuarioPassword, setUsuarioPassword] = useState('');
  const [repetirPassword, setRepetirPassword] = useState('');
  const [rol, setRol] = useState(ROLES[0]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (usuarioPassword !== repetirPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setEnviando(true);
    setError(null);

    try {
      const creado = await crearUsuario({
        rut: rut.trim(),
        usuarioNombre: usuarioNombre.trim(),
        usuarioEmail: usuarioEmail.trim(),
        usuarioPassword,
        rol,
      });
      onSuccess(creado);
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content usuario-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Nuevo usuario</h2>

        <form onSubmit={handleSubmit}>
          <label htmlFor="usrRut">RUT</label>
          <input
            id="usrRut"
            type="text"
            placeholder="12345678-5"
            maxLength={12}
            autoComplete="off"
            value={rut}
            onChange={(e) => setRut(e.target.value)}
            required
          />

          <label htmlFor="usrNombre">Nombre completo</label>
          <input
            id="usrNombre"
            type="text"
            maxLength={100}
            autoComplete="off"
            value={usuarioNombre}
            onChange={(e) => setUsuarioNombre(e.target.value)}
            required
          />

          <label htmlFor="usrEmail">Correo electrónico</label>
          <input
            id="usrEmail"
            type="email"
            maxLength={100}
            autoComplete="off"
            value={usuarioEmail}
            onChange={(e) => setUsuarioEmail(e.target.value)}
            required
          />

          <label htmlFor="usrPassword">Contraseña inicial</label>
          <input
            id="usrPassword"
            type="password"
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            value={usuarioPassword}
            onChange={(e) => setUsuarioPassword(e.target.value)}
            required
          />
          <p className="usuario-ayuda">Mínimo 8 caracteres. Compártela con la persona de forma segura.</p>

          <label htmlFor="usrRepetir">Repite la contraseña</label>
          <input
            id="usrRepetir"
            type="password"
            maxLength={72}
            autoComplete="new-password"
            value={repetirPassword}
            onChange={(e) => setRepetirPassword(e.target.value)}
            required
          />

          <label htmlFor="usrRol">Rol</label>
          <select id="usrRol" value={rol} onChange={(e) => setRol(e.target.value)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          {rol === "Admin" && (
            <p className="usuario-aviso">Esta cuenta tendrá acceso total al sistema.</p>
          )}

          {error && <p className="form-error" role="alert">{error}</p>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={enviando}>Cancelar</button>
            <button type="submit" disabled={enviando}>
              {enviando ? "Creando..." : "Crear usuario"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CrearUsuarioModal;