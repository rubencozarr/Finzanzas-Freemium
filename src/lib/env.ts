// Por defecto la app funciona 100% en local (localStorage + usuario mock), sin
// necesitar un proyecto Supabase ni pantalla de login. Poner VITE_DATA_BACKEND=supabase
// en .env activa el backend real una vez tengas las credenciales y el login montado.
export const DATA_BACKEND: "local" | "supabase" = import.meta.env.VITE_DATA_BACKEND === "supabase" ? "supabase" : "local";

export const isLocalBackend = DATA_BACKEND === "local";
