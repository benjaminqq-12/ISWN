import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

import RootLayout from "./layouts/RootLayout";

import Home from "./pages/Home";
import NuestrasMascotas from "./pages/NuestrasMascotas";
import RegistrarVoluntario from "./pages/RegistrarVoluntario";

export default function App() {

  return (

    <Router>

      <Routes>

        <Route
          path="/"
          element={<RootLayout />}
        >

          {/* Página de inicio */}
          <Route
            index
            element={<Home />}
          />

          {/* Mascotas */}
          <Route
            path="mascotas"
            element={<NuestrasMascotas />}
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