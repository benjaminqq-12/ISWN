import { useState } from "react";
import "../styles/atencionMedica.css";

export default function AtencionMedica() {
  const [formulario, setFormulario] = useState({
    mascota_id: "",
    veterinario_id: "1",
    atencion_tipo: "PREVENTIVA",
    atencion_diagnostico: "",
    atencion_tratamiento: "",
    atencion_observaciones: ""
  });

  const [mensaje, setMensaje] = useState("");

  const handleChange = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMensaje("Registrando atención...");

    try {
      const respuesta = await fetch(
        "http://localhost:3000/api/atenciones-medicas",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            mascota_id: Number(formulario.mascota_id),
            veterinario_id: Number(formulario.veterinario_id),
            atencion_tipo: formulario.atencion_tipo,
            atencion_diagnostico: formulario.atencion_diagnostico,
            atencion_tratamiento: formulario.atencion_tratamiento,
            atencion_observaciones: formulario.atencion_observaciones
          })
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setMensaje(datos.message || "Ocurrió un error");
        return;
      }

      setMensaje("Atención médica registrada correctamente.");

      setFormulario({
        mascota_id: "",
        veterinario_id: "1",
        atencion_tipo: "PREVENTIVA",
        atencion_diagnostico: "",
        atencion_tratamiento: "",
        atencion_observaciones: ""
      });

    } catch (error) {
      console.error(error);
      setMensaje("No se pudo conectar con el servidor.");
    }
  };

  return (
    <div className="atencion-container">
      <div className="atencion-card">

        <h1>Registro de Atención Médica</h1>

        <p className="atencion-descripcion">
          Registra una atención médica para una mascota.
        </p>

        <div className="veterinario-info">
          <strong>Veterinario:</strong> Veterinario
          <span>Medicina Veterinaria</span>
        </div>

        <form onSubmit={handleSubmit}>

          <div className="form-group">
            <label htmlFor="mascota_id">
              ID de la mascota
            </label>

            <input
              type="number"
              id="mascota_id"
              name="mascota_id"
              value={formulario.mascota_id}
              onChange={handleChange}
              placeholder="Ej: 1"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="atencion_tipo">
              Tipo de atención
            </label>

            <select
              id="atencion_tipo"
              name="atencion_tipo"
              value={formulario.atencion_tipo}
              onChange={handleChange}
            >
              <option value="PREVENTIVA">
                Preventiva
              </option>

              <option value="URGENCIA">
                Urgencia
              </option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="atencion_diagnostico">
              Diagnóstico
            </label>

            <textarea
              id="atencion_diagnostico"
              name="atencion_diagnostico"
              value={formulario.atencion_diagnostico}
              onChange={handleChange}
              placeholder="Ingrese el diagnóstico"
              rows="4"
              required
            ></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="atencion_tratamiento">
              Tratamiento
            </label>

            <textarea
              id="atencion_tratamiento"
              name="atencion_tratamiento"
              value={formulario.atencion_tratamiento}
              onChange={handleChange}
              placeholder="Ingrese el tratamiento"
              rows="4"
              required
            ></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="atencion_observaciones">
              Observaciones
            </label>

            <textarea
              id="atencion_observaciones"
              name="atencion_observaciones"
              value={formulario.atencion_observaciones}
              onChange={handleChange}
              placeholder="Observaciones adicionales (opcional)"
              rows="3"
            ></textarea>
          </div>

          <button type="submit" className="btn-registrar">
            Registrar atención
          </button>

        </form>

        {mensaje && (
          <p className="mensaje-atencion">
            {mensaje}
          </p>
        )}

      </div>
    </div>
  );
}