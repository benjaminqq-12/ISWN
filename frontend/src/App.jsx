import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

import RootLayout from "./layouts/RootLayout";

import Home from "./pages/Home";
import AtencionMedica from "./pages/AtencionMedica";
import Eventos from "./pages/Eventos.jsx";
import NuestrasMascotas from "./pages/NuestrasMascotas";
import RegistrarVoluntario from "./pages/RegistrarVoluntario";
import MascotaPerfil from "./pages/MascotaPerfil";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootLayout />}>

          {/* Página de inicio */}
          <Route index element={<Home />} />

          {/* Atención médica - Desarrollo */}
          <Route
            path="atencion-medica"
            element={<AtencionMedica />}
          />

          {/* Eventos - Desarrollo */}
          <Route
            path="eventos"
            element={<Eventos />}
          />

          {/* Mascotas - Desarrollo */}
          <Route
            path="mascotas"
            element={<NuestrasMascotas />}
          />

          <Route
            path="mascotas/:id"
            element={<MascotaPerfil />}
          />

          {/* Voluntarios - ramaIgnacio */}
          <Route
            path="voluntarios/registrar"
            element={<RegistrarVoluntario />}
          />

        </Route>
      </Routes>
    </Router>
  );
}