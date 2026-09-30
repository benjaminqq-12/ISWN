import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import Home from "./pages/Home";
import AtencionMedica from "./pages/AtencionMedica";

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

        </Route>
      </Routes>
    </Router>
  );
}