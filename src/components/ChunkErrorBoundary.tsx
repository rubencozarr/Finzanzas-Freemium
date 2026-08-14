import { Component, type ReactNode } from "react";

interface ChunkErrorBoundaryProps {
  children: ReactNode;
}

interface ChunkErrorBoundaryState {
  error: Error | null;
}

const CHUNK_ERROR_PATTERN =
  /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i;

/** Red de seguridad para los 5 tabs y 8 modales cargados con React.lazy() (ver App.tsx): si una pestaña
 * lleva abierta desde antes de un despliegue nuevo y el usuario navega a algo que esa sesión todavía no
 * había descargado, el import() dinámico puede fallar (el chunk con ese hash ya no existe en el
 * servidor). React.lazy() propaga esa promesa rechazada como un error de RENDER, no como algo que
 * Suspense pueda capturar por sí solo — hace falta un Error Boundary explícito o tumba todo el árbol de
 * React sin ninguna pantalla de recuperación (antes de esto, esa era exactamente la vía a una pantalla
 * en blanco sin explicación). Solo puede ser un componente de clase: no existe equivalente en hooks.
 */
export class ChunkErrorBoundary extends Component<ChunkErrorBoundaryProps, ChunkErrorBoundaryState> {
  state: ChunkErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ChunkErrorBoundaryState {
    return { error };
  }

  reload = async () => {
    // Se desregistra el Service Worker actual ANTES de recargar (no solo recargar): si el error vino de
    // una caché desactualizada, una recarga normal podría volver a servirse desde ella. Sin esto, un
    // usuario podía quedarse pulsando "Recargar" repetidamente sin que el problema se resolviera nunca,
    // igual que antes solo lo arreglaba un "Unregister" manual.
    try {
      const registrations = await navigator.serviceWorker?.getRegistrations();
      await Promise.all((registrations ?? []).map((r) => r.unregister()));
    } catch {
      // Si falla el desregistro, se recarga igualmente: es mejor una recarga normal que quedarse
      // parado en la pantalla de error.
    }
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    const isChunkError = CHUNK_ERROR_PATTERN.test(this.state.error.message);
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6 text-center">
        <p className="font-serif text-xl text-slate-800 mb-2">
          {isChunkError ? "Hay una nueva versión de Nitid disponible" : "Ha ocurrido un error inesperado"}
        </p>
        <p className="text-stone-600 text-sm mb-6 max-w-xs">
          {isChunkError
            ? "Esta pestaña llevaba abierta desde antes de una actualización. Recarga para seguir usando Nitid."
            : "Recarga la página para intentarlo de nuevo."}
        </p>
        <button onClick={this.reload} className="bg-teal-700 text-white rounded-lg px-5 py-2.5 text-sm font-medium">
          Recargar
        </button>
      </div>
    );
  }
}
