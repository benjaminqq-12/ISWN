import { Outlet, useOutletContext } from 'react-router-dom';

const ProtectedRoute = ({ roles }) => {
  const context = useOutletContext();
  const session = context?.session;

  if (!session) {
    return (
      <section className="container mascota-feedback">
        <p role="alert">Debes iniciar sesión para ver esta página.</p>
      </section>
    );
  }

  if (roles && !roles.includes(session.user?.rol)) {
    return (
      <section className="container mascota-feedback">
        <p role="alert">No tienes permisos para ver esta página.</p>
      </section>
    );
  }

  return <Outlet context={context} />;
};

export default ProtectedRoute;