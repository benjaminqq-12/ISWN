import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import Home from "./pages/Home";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          {/* El index indica que Home se cargará por defecto al entrar a la raíz "/" */}
          <Route index element={<Home />} />
        </Route>
      </Routes>
    </Router>
  );
}