import { useEffect, useRef } from 'react';
import '../styles/registro.css';

export default function RegistroModal({ onClose, onSubmit, onLogin, error, loading }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  function handleCancel(event) {
    event.preventDefault();
    onClose();
  }

  function handleBackdropClick(event) {
    if (event.target === dialogRef.current) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className="login-modal registro-modal"
      aria-label="Crear cuenta"
      onCancel={handleCancel}
      onClick={handleBackdropClick}
    >
      <form className="login-form" onSubmit={onSubmit}>
        <label>
          RUT
          <input name="rut" type="text" placeholder="12345678-5" maxLength={12} autoComplete="off" required />
        </label>
        <label>
          Nombre completo
          <input name="usuarioNombre" type="text" maxLength={100} autoComplete="name" required />
        </label>
        <label>
          Correo electrónico
          <input name="usuarioEmail" type="email" maxLength={100} autoComplete="email" required />
        </label>
        <label>
          Contraseña
          <input name="usuarioPassword" type="password" minLength={8} maxLength={72} autoComplete="new-password" required />
        </label>
        <p className="registro-ayuda">Mínimo 8 caracteres.</p>
        <label>
          Repite la contraseña
          <input name="repetirPassword" type="password" maxLength={72} autoComplete="new-password" required />
        </label>
        {error && <p className="login-error" role="alert">{error}</p>}
        <button className="login-submit" type="submit" disabled={loading}>
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </button>
        <button className="login-link" type="button" onClick={onLogin}>
          ¿Ya tienes cuenta? Inicia sesión
        </button>
      </form>
    </dialog>
  );
}