
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export default function CrearCuentaVoluntario() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [cargando, setCargando] = useState(true);
  const [voluntario, setVoluntario] = useState(null);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");

  useEffect(() => {
    let activo = true;

    async function verificarInvitacion() {
      if (!token) {
        setError("El enlace de invitación no es válido.");
        setCargando(false);
        return;
      }

      try {
        const respuesta = await axios.get(
          `${API_URL}/activacion-voluntario/verificar/${encodeURIComponent(token)}`
        );

        if (activo) {
          setVoluntario(respuesta.data.data);
        }
      } catch (err) {
        if (activo) {
          setError(
            err.response?.data?.message ||
              "El enlace no es válido o ya venció."
          );
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    verificarInvitacion();

    return () => {
      activo = false;
    };
  }, [token]);

  async function crearCuenta(evento) {
    evento.preventDefault();
    setError("");

    if (password.length < 8 || password.length > 72) {
      setError("La contraseña debe tener entre 8 y 72 caracteres.");
      return;
    }

    if (password !== confirmarPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setEnviando(true);

    try {
      await axios.post(`${API_URL}/activacion-voluntario/activar`, {
        token,
        password,
        confirmarPassword,
      });

      setExito(true);
      setPassword("");
      setConfirmarPassword("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "No fue posible crear tu cuenta. Inténtalo nuevamente."
      );
    } finally {
      setEnviando(false);
    }
  }

  if (cargando) {
    return (
      <main className="mx-auto max-w-xl p-8 text-center">
        <p>Verificando tu invitación...</p>
      </main>
    );
  }

  if (exito) {
    return (
      <main className="mx-auto max-w-xl p-8 text-center">
        <h1 className="mb-4 text-2xl font-bold text-green-700">
          ¡Cuenta creada exitosamente!
        </h1>
        <p>
          Ya puedes iniciar sesión con tu correo electrónico y contraseña.
        </p>
      </main>
    );
  }

  if (!voluntario) {
    return (
      <main className="mx-auto max-w-xl p-8 text-center">
        <h1 className="mb-4 text-2xl font-bold">
          Invitación no disponible
        </h1>
        <p className="text-red-600">{error}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-3 text-2xl font-bold text-gray-900">
          Crear cuenta de voluntario
        </h1>

        <p className="mb-6 text-gray-600">
          ¡Bienvenido, {voluntario.nombreCompleto}!
          Tu solicitud fue aprobada.
        </p>

        <p className="mb-6 text-sm text-gray-500">
          Correo asociado: {voluntario.email}
        </p>

        <form onSubmit={crearCuenta} className="space-y-5">
          <div>
            <label
              htmlFor="password"
              className="mb-2 block font-medium text-gray-700"
            >
              Contraseña
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              maxLength={72}
              required
              autoComplete="new-password"
              className="w-full rounded border border-gray-300 p-3 text-gray-900"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <div>
            <label
              htmlFor="confirmarPassword"
              className="mb-2 block font-medium text-gray-700"
            >
              Confirmar contraseña
            </label>

            <input
              id="confirmarPassword"
              type="password"
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              minLength={8}
              maxLength={72}
              required
              autoComplete="new-password"
              className="w-full rounded border border-gray-300 p-3 text-gray-900"
              placeholder="Repite tu contraseña"
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
          >
            {enviando ? "Creando cuenta..." : "Crear mi cuenta"}
          </button>
        </form>
      </div>
    </main>
  );
}
