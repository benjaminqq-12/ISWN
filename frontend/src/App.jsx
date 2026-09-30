import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import Home from "./pages/Home";
import Eventos from './pages/Eventos.jsx';
import NuestrasMascotas from "./pages/NuestrasMascotas";
import MascotaPerfil from "./pages/MascotaPerfil";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          {/* El index indica que Home se cargara por defecto al entrar a la raiz "/" */}
          <Route index element={<Home />} />
          <Route path="eventos" element={<Eventos />} />
          <Route path="/mascotas" element={<NuestrasMascotas />} />
          <Route path="/mascotas/:id" element={<MascotaPerfil />} />
        </Route>
      </Routes>
    </Router>
  );
}