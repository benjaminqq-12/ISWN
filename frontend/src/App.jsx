import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

import RootLayout from "./layouts/RootLayout";

import Home from "./pages/Home";
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

          {/* Eventos */}
          <Route
            path="eventos"
            element={<Eventos />}
          />

          {/* Mascotas */}
          <Route
            path="mascotas"
            element={<NuestrasMascotas />}
          />

          <Route
            path="mascotas/:id"
            element={<MascotaPerfil />}
          />

          {/* Voluntarios */}
          <Route
            path="voluntarios/registrar"
            element={<RegistrarVoluntario />}
          />

        </Route>
      </Routes>
    </Router>
  );
}