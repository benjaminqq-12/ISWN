import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

import RootLayout from "./layouts/RootLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import AtencionMedica from "./pages/AtencionMedica";
import Eventos from "./pages/Eventos.jsx";
import NuestrasMascotas from "./pages/NuestrasMascotas";
import RegistrarVoluntario from "./pages/RegistrarVoluntario";
import MascotaPerfil from "./pages/MascotaPerfil";
import Error404 from "./pages/Error404";
import Inventario from "./pages/Inventario.jsx";
import RequirePersonal from "./components/inventario/RequirePersonal.jsx";
import Solicitudes from "./pages/Solicitudes";
import Donaciones from "./pages/Donaciones.jsx";
import DonacionResultado from "./pages/DonacionResultado.jsx";
import MisSolicitudes from "./pages/MisSolicitudes";
import Usuarios from "./pages/Usuarios";
import SolicitudesVoluntarios from "./pages/SolicitudesVoluntarios";
import CrearCuentaVoluntario from "./pages/CrearCuentaVoluntario";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootLayout />}>

          {/* Página de inicio */}
          <Route index element={<Home />} />
          <Route path="/eventos" element={<Eventos />} />
          <Route path="/donaciones" element={<Donaciones />} />
          <Route path="/donaciones/resultado" element={<DonacionResultado />} />
          <Route path="/mascotas" element={<NuestrasMascotas />} />
          <Route path="/mascotas/:id" element={<MascotaPerfil />} />
          <Route element={<ProtectedRoute roles={["Admin", "Voluntario"]} />}>
            <Route path="/solicitudes" element={<Solicitudes />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/mis-solicitudes" element={<MisSolicitudes />} />
          </Route>
          <Route element={<ProtectedRoute roles={["Admin"]} />}>
            <Route path="/usuarios" element={<Usuarios />} />
          </Route>
          <Route path="*" element={<Error404 />} />

          <Route path="inventario" element={<RequirePersonal><Inventario /></RequirePersonal>} />

          {/* Atención médica - Desarrollo */}
          <Route
            path="atencion-medica"
            element={<AtencionMedica />}
          />
          {/* Voluntarios - ramaIgnacio */}
          <Route
            path="voluntarios/registrar"
            element={<RegistrarVoluntario />}
          />
          {/* Activación de cuenta de voluntarios aprobados */}
          <Route
            path="crear-cuenta-voluntario"
            element={<CrearCuentaVoluntario />}
          />
          {/* RF2 - Gestión de solicitudes de voluntariado */}
          <Route element={<ProtectedRoute roles={["Admin"]} />}>
            <Route
              path="voluntarios/solicitudes"
              element={<SolicitudesVoluntarios />}
            />
          </Route>

        </Route>
      </Routes>
    </Router>
  );
}