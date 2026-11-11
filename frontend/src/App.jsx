import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import AtencionMedica from "./pages/AtencionMedica";
import Eventos from './pages/Eventos.jsx';
import NuestrasMascotas from "./pages/NuestrasMascotas";
import MascotaPerfil from "./pages/MascotaPerfil";
import Error404 from "./pages/Error404";
import Inventario from "./pages/Inventario.jsx";
import RequirePersonal from "./components/inventario/RequirePersonal.jsx";
import Solicitudes from "./pages/Solicitudes";
import Donaciones from "./pages/Donaciones.jsx";
import DonacionResultado from "./pages/DonacionResultado.jsx";
import MisSolicitudes from "./pages/MisSolicitudes";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootLayout />}>

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
          <Route path="*" element={<Error404 />} />

          <Route path="inventario" element={<RequirePersonal><Inventario /></RequirePersonal>} />

          {/* Atención médica - Desarrollo */}
          <Route
            path="atencion-medica"
            element={<AtencionMedica />}
          />

          <Route path="eventos" element={<Eventos />} />
          <Route path="/mascotas" element={<NuestrasMascotas />} />
          <Route path="/mascotas/:id" element={<MascotaPerfil />} />
        </Route>
      </Routes>
    </Router>
  );
}