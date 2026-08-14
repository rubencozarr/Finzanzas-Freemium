// Mismo "Cargando..." a pantalla completa que ya usaban authLoading/privacyLoading en App.tsx,
// extraído aquí para no triplicarlo al añadir el fallback de Suspense del bundle autenticado
// (React.lazy de los 5 tabs y los modales, ver App.tsx).
export function LoadingScreen() {
  return <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-500 text-sm">Cargando...</div>;
}
