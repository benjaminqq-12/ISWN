import { useEffect, useRef } from 'react';

export default function LoginModal({ onClose, onSubmit, error, loading }) {
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
      className="login-modal"
      aria-label="Iniciar sesión"
      onCancel={handleCancel}
      onClick={handleBackdropClick}
    >
      <form className="login-form" onSubmit={onSubmit}>
        <label>
          Correo electrónico
          <input name="usuarioEmail" type="email" autoComplete="username" required />
        </label>
        <label>
          Contraseña
          <input name="usuarioPassword" type="password" autoComplete="current-password" required />
        </label>
        {error && <p className="login-error" role="alert">{error}</p>}
        <button className="login-submit" type="submit" disabled={loading}>
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </dialog>
  );
}
