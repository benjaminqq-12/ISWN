import {
  Navigate,
  useOutletContext,
} from "react-router-dom";

export default function RequirePersonal({ children }) {
  const { session, comprobandoSesion } = useOutletContext();

  if (comprobandoSesion) {
    return (
      <div className="pagina-error" role="status">
        Verificando permisos de acceso...
      </div>
    );
  }

  const rolesPermitidos = [
    "Admin",
    "Voluntario",
    "Veterinario",
  ];

  const autorizado =
    session?.user?.activo &&
    rolesPermitidos.includes(session.user.rol);

  if (!autorizado) {
    return <Navigate to="/" replace />;
  }

  return children;
}