import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import Home from "./pages/Home";
import AtencionMedica from "./pages/AtencionMedica";
import Eventos from './pages/Eventos.jsx';
import NuestrasMascotas from "./pages/NuestrasMascotas";
import MascotaPerfil from "./pages/MascotaPerfil";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootLayout />}>

          <Route index element={<Home />} />

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