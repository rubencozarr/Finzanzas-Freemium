import { useEffect, useRef, useState, type PropsWithChildren } from "react";
import { Zap, PieChart, Target, ShieldCheck, Ban, Layers, Heart, Check, Lock } from "lucide-react";
import { PLAY_STORE_URL } from "../lib/constants";

interface LandingPageProps {
  onLoginClick: () => void;
}

const SEO_TITLE = "Nitid: Control de Gastos — Tus finanzas con claridad";
const SEO_DESCRIPTION =
  "Registra gastos, ahorra con metas y analiza tus finanzas. Sin banco, sin anuncios, gratis. Descarga Nitid en Google Play.";

// La landing solo se monta para visitantes sin sesión desde el navegador (ver App.tsx); mientras esté
// montada sustituye el <title>/<meta description> genéricos de index.html por unos orientados a
// conversión y descubrimiento (Google, compartidos en redes), y los restaura al desmontar para no
// dejar estos tags "filtrados" una vez el usuario entra a la app.
function useLandingSeo() {
  useEffect(() => {
    const originalTitle = document.title;
    const descriptionTag = document.querySelector('meta[name="description"]');
    const originalDescription = descriptionTag?.getAttribute("content") ?? null;

    document.title = SEO_TITLE;
    descriptionTag?.setAttribute("content", SEO_DESCRIPTION);

    const ogTags: Array<[string, string]> = [
      ["og:title", SEO_TITLE],
      ["og:description", SEO_DESCRIPTION],
      ["og:image", "https://nitidapp.com/icon-512.png"],
      ["og:url", "https://nitidapp.com"],
    ];
    const createdTags = ogTags.map(([property, content]) => {
      const meta = document.createElement("meta");
      meta.setAttribute("property", property);
      meta.setAttribute("content", content);
      document.head.appendChild(meta);
      return meta;
    });

    return () => {
      document.title = originalTitle;
      if (originalDescription !== null) descriptionTag?.setAttribute("content", originalDescription);
      createdTags.forEach((tag) => tag.remove());
    };
  }, []);
}

function Reveal({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"} ${className}`}
    >
      {children}
    </div>
  );
}

function DeviceFrame({ src, alt, eager = false, className = "" }: { src: string; alt: string; eager?: boolean; className?: string }) {
  return (
    <div className={`w-full max-w-[260px] sm:max-w-[280px] rounded-[24px] border border-stone-200 shadow-xl bg-white overflow-hidden ${className}`}>
      <div className="flex items-center justify-center gap-1.5 py-2.5 bg-white">
        <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
        <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
        <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
      </div>
      <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} className="w-full block" />
    </div>
  );
}

function TrustBadges({ className = "" }: { className?: string }) {
  const items = ["Gratis para siempre", "Sin anuncios", "Sin banco"];
  return (
    <div className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-sm text-stone-400 ${className}`}>
      {items.map((item, i) => (
        <span key={item} className="flex items-center gap-2">
          {i > 0 && <span className="text-stone-300">·</span>}
          <span className="inline-flex items-center gap-1">
            <Check size={14} className="text-teal-500" strokeWidth={2.5} />
            {item}
          </span>
        </span>
      ))}
    </div>
  );
}

const STEPS = [
  { number: "1", icon: Zap, title: "Registra en segundos", description: "Cada café, cada compra, cada recibo. En 3 toques." },
  { number: "2", icon: PieChart, title: "Ve a dónde va tu dinero", description: "Gráficos claros que te muestran tus hábitos reales." },
  { number: "3", icon: Target, title: "Ahorra para lo que importa", description: "Crea fondos con metas y ve tu progreso cada día." },
];

const DIFFERENTIATORS = [
  { icon: ShieldCheck, title: "Privacidad total", description: "Sin banco, sin contraseñas bancarias. Solo tú ves tus datos." },
  { icon: Ban, title: "Sin anuncios", description: "Ni ahora ni nunca. Tu experiencia sin interrupciones." },
  { icon: Layers, title: "Todo en una app", description: "Gastos, ahorro e inversión juntos. Sin necesitar tres apps diferentes." },
  { icon: Heart, title: "Precio justo", description: "Empieza gratis. Premium desde 2,50€/mes si quieres más." },
];

const FREE_FEATURES = [
  "Transacciones ilimitadas",
  "2 fondos de ahorro",
  "Gráficos mensuales",
  "6 meses de historial",
  "Exportación de datos",
];

const SCREENSHOTS = [
  { src: "/screenshot-raw-mensual.webp", caption: "Entiende tus gastos" },
  { src: "/screenshot-raw-fondos.webp", caption: "Ahorra con metas" },
  { src: "/screenshot-raw-anual.webp", caption: "Analiza tu año" },
];

const TRUST_MINI_BADGES = ["🔒 Cifrado en tránsito", "🛡️ Sin terceros", "📋 RGPD"];

export function LandingPage({ onLoginClick }: LandingPageProps) {
  useLandingSeo();

  return (
    <div className="min-h-screen bg-white text-stone-800 font-sans">
      {/* HERO */}
      <section className="px-5 py-16 sm:py-24">
        <div className="max-w-[1024px] mx-auto flex flex-col sm:flex-row items-center gap-12 sm:gap-8">
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left sm:w-[60%]">
            <img src="/icon-512.png" alt="Nitid" width={48} height={48} className="rounded-xl mb-6" />
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-stone-900 max-w-md">
              ¿Sabes en qué se va tu dinero cada mes?
            </h1>
            <p className="mt-4 text-stone-500 text-base sm:text-lg max-w-sm">
              Controla tus gastos, ahorra con metas y entiende tus finanzas. Sin conectar con tu banco.
            </p>
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-teal-600 px-8 py-4 text-white font-semibold text-base shadow-lg shadow-teal-600/20 hover:bg-teal-700 active:scale-[0.98] transition-all"
            >
              Descargar gratis en Google Play
            </a>
            <TrustBadges className="mt-5" />
            <button onClick={onLoginClick} className="mt-4 text-sm text-stone-400 underline underline-offset-2 hover:text-stone-600">
              Ya tengo cuenta → Iniciar sesión
            </button>
          </div>
          <div className="sm:w-[40%] flex justify-center">
            <DeviceFrame src="/screenshot-raw-movimientos.webp" alt="Pantalla de movimientos de Nitid" eager />
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="px-5 py-16 sm:py-24 bg-stone-50">
        <div className="max-w-[1024px] mx-auto">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-stone-800 mb-12">Así de fácil</h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {STEPS.map((step) => (
              <Reveal key={step.number} className="flex flex-col items-center text-center">
                <div className="flex items-center justify-center w-14 h-14 rounded-full bg-teal-50 text-teal-600 font-bold text-xl">
                  {step.number}
                </div>
                <step.icon className="mt-3 text-teal-600" size={26} strokeWidth={1.75} />
                <h3 className="mt-3 font-bold text-stone-800">{step.title}</h3>
                <p className="mt-1 text-sm text-stone-500">{step.description}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* SCREENSHOTS */}
      <section className="px-5 py-16 sm:py-24">
        <div className="max-w-[1024px] mx-auto">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-stone-800 mb-12">Tu dinero, con claridad</h2>
          </Reveal>
          <Reveal>
            <div className="flex gap-6 overflow-x-auto pb-2 sm:justify-center sm:overflow-visible snap-x snap-mandatory sm:snap-none -mx-5 px-5 sm:mx-0 sm:px-0">
              {SCREENSHOTS.map((shot) => (
                <div key={shot.src} className="flex-none snap-center flex flex-col items-center">
                  <DeviceFrame src={shot.src} alt={shot.caption} />
                  <p className="mt-4 text-sm text-stone-600 text-center">{shot.caption}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* DIFERENCIADORES */}
      <section className="px-5 py-16 sm:py-24 bg-stone-50">
        <div className="max-w-[1024px] mx-auto">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-stone-800 mb-12">¿Por qué Nitid?</h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
            {DIFFERENTIATORS.map((item) => (
              <Reveal key={item.title} className="flex flex-col items-start p-6 rounded-2xl bg-white border border-stone-200 shadow-sm">
                <item.icon className="text-teal-600" size={32} strokeWidth={1.5} />
                <h3 className="mt-3 font-bold text-stone-800">{item.title}</h3>
                <p className="mt-1 text-sm text-stone-500">{item.description}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* VERSION GRATUITA */}
      <section className="px-5 py-16 sm:py-24">
        <div className="max-w-[1024px] mx-auto">
          <Reveal className="flex flex-col sm:flex-row items-center gap-12 sm:gap-16">
            <div className="sm:w-1/2 text-center sm:text-left">
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-800">Empieza gratis. De verdad.</h2>
              <p className="mt-2 text-stone-500">Sin trucos. Sin límite de tiempo. Sin publicidad.</p>
              <ul className="mt-8 flex flex-col gap-3">
                {FREE_FEATURES.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-stone-700">
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-teal-50 shrink-0">
                      <Check className="text-teal-600" size={16} strokeWidth={2.5} />
                    </span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-stone-400 italic">¿Necesitas más? Premium desde 2,50€/mes. Sin permanencia.</p>
            </div>
            <div className="sm:w-1/2 w-full flex justify-center">
              <div className="w-full max-w-xs rounded-2xl border border-stone-200 bg-stone-50 p-7 shadow-sm text-center">
                <span className="inline-block bg-teal-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                  Gratis para siempre
                </span>
                <p className="mt-5 text-5xl font-bold text-stone-900">0€</p>
                <p className="mt-1 text-stone-500 text-sm">Sin límite de tiempo, sin tarjeta</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* CONFIANZA */}
      <section className="px-5 py-16 sm:py-24 bg-teal-600 text-white">
        <div className="max-w-lg mx-auto text-center flex flex-col items-center">
          <Reveal className="flex flex-col items-center">
            <Lock className="text-white" size={40} strokeWidth={1.5} />
            <h2 className="mt-5 text-2xl sm:text-3xl font-bold">Tus datos son tuyos</h2>
            <p className="mt-4 text-teal-100 leading-relaxed">
              Cero analítica de terceros. Cero cookies de rastreo. Cero SDKs publicitarios. Cumplimos con el RGPD.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              {TRUST_MINI_BADGES.map((badge) => (
                <span key={badge} className="bg-teal-700 text-sm px-4 py-1.5 rounded-full">
                  {badge}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-5 py-16 sm:py-24 bg-stone-50 text-center">
        <div className="max-w-[1024px] mx-auto flex flex-col items-center">
          <Reveal className="flex flex-col items-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-800 max-w-sm">Empieza hoy a ver tus finanzas con claridad</h2>
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-teal-600 px-8 py-4 text-white font-semibold text-base shadow-lg shadow-teal-600/20 hover:bg-teal-700 active:scale-[0.98] transition-all"
            >
              Descargar gratis en Google Play
            </a>
            <TrustBadges className="mt-5" />
            <img src="/icon-512.png" alt="Nitid" width={32} height={32} className="mt-8 rounded-lg opacity-90" />
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-stone-800 text-stone-400 px-5 py-10 text-sm">
        <div className="max-w-[1024px] mx-auto flex flex-col items-center gap-3 text-center">
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            <a href="/privacy" className="hover:text-white">
              Política de privacidad
            </a>
            <span className="text-stone-600">·</span>
            <a href="/delete-account" className="hover:text-white">
              Eliminar cuenta
            </a>
            <span className="text-stone-600">·</span>
            <a href="mailto:contacto@nitidapp.com" className="hover:text-white">
              contacto@nitidapp.com
            </a>
          </div>
          <p className="text-stone-500">© 2026 Nitid Apps</p>
        </div>
      </footer>
    </div>
  );
}
