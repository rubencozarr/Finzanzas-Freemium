import { useEffect, useRef, useState, type PropsWithChildren } from "react";
import { Zap, PieChart, Target, ShieldCheck, Ban, Layers, Heart, Lock, Check } from "lucide-react";
import { PLAY_STORE_URL } from "../lib/constants";

interface LandingPageProps {
  onLoginClick: () => void;
}

const SEO_TITLE = "Nitid: Control de Gastos — Tus finanzas con claridad";
const SEO_DESCRIPTION = "Registra gastos, ahorra con metas y analiza tus finanzas. Sin banco, sin anuncios, gratis. Descarga Nitid.";

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
    <div className={`w-[220px] sm:w-full sm:max-w-[260px] rounded-[24px] border border-stone-200 shadow-xl bg-white overflow-hidden ${className}`}>
      <div className="flex items-center justify-center gap-1.5 py-2 bg-white">
        <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
        <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
        <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
      </div>
      <img src={src} alt={alt} loading={eager ? "eager" : "lazy"} className="w-full block object-contain" />
    </div>
  );
}

function SectionTitleAccent() {
  return <div className="w-10 h-[3px] bg-teal-500 rounded-full mx-auto mt-2 mb-6" />;
}

function CheckRow({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 shrink-0">
        <Check className="text-emerald-600" size={14} strokeWidth={3} />
      </span>
      <span className="text-sm text-stone-700">{text}</span>
    </div>
  );
}

const TRUST_BADGES = ["Gratis", "Sin anuncios", "Sin banco"];

const EASY_STEPS = [
  { icon: Zap, text: "Registra en 3 toques" },
  { icon: PieChart, text: "Ve tus hábitos" },
  { icon: Target, text: "Ahorra con metas" },
];

const SCREENSHOTS = [
  { src: "/screenshot-raw-mensual.webp", caption: "Entiende tus gastos" },
  { src: "/screenshot-raw-fondos.webp", caption: "Ahorra con metas" },
  { src: "/screenshot-raw-anual.webp", caption: "Analiza tu año" },
];

const DIFFERENTIATORS = [
  { icon: ShieldCheck, title: "Sin conexión bancaria", description: "No pedimos contraseñas de banco. Tú introduces tus datos manualmente." },
  { icon: Ban, title: "Sin anuncios", description: "Experiencia limpia, sin interrupciones." },
  { icon: Layers, title: "Todo en una app", description: "Gastos, ahorro e inversión en un solo lugar." },
  { icon: Heart, title: "Precio justo", description: "Gratis para empezar. Premium desde 2,50€/mes." },
];

const FREE_FEATURES = [
  "Transacciones ilimitadas",
  "2 fondos de ahorro",
  "Gráficos mensuales",
  "6 meses de historial",
  "Exportación de datos",
  "Sin publicidad",
];

export function LandingPage({ onLoginClick }: LandingPageProps) {
  useLandingSeo();

  return (
    <div className="min-h-screen bg-white text-stone-800 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* HERO */}
        <section className="px-5 pt-4 pb-8 sm:py-12">
          <div className="max-w-[1024px] mx-auto flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            <div className="flex flex-col items-center sm:items-start sm:w-[55%]">
              <img src="/icon-512.png" alt="Nitid" width={36} height={36} className="rounded-lg mb-3" />
              <div className="w-full bg-stone-50 border border-stone-200 rounded-2xl shadow-sm p-6 sm:p-8 flex flex-col items-center sm:items-start text-center sm:text-left">
                <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-stone-900 max-w-md">
                  ¿Sabes en qué se va tu dinero cada mes?
                </h1>
                <p className="mt-2 text-stone-500 text-sm sm:text-base max-w-sm">
                  Controla tus gastos, ahorra con metas y entiende tus finanzas.
                </p>
                <a
                  href={PLAY_STORE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center justify-center rounded-xl bg-teal-600 px-6 py-3 text-white font-semibold text-sm sm:text-base shadow-md hover:bg-teal-700 active:scale-[0.98] transition-all"
                >
                  Descargar gratis en Google Play
                </a>
                <div className="mt-3 flex items-center justify-center sm:justify-start gap-3">
                  {TRUST_BADGES.map((label) => (
                    <span key={label} className="flex items-center gap-1.5 text-xs text-stone-600 whitespace-nowrap">
                      <span className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 shrink-0">
                        <Check className="text-emerald-600" size={10} strokeWidth={3} />
                      </span>
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="sm:w-[45%] flex flex-col items-center gap-3">
              <DeviceFrame src="/screenshot-raw-movimientos.webp" alt="Pantalla de movimientos de Nitid" eager />
              <button
                onClick={onLoginClick}
                className="rounded-lg border border-stone-300 px-4 py-2 text-xs text-stone-600 hover:bg-stone-50 transition-colors"
              >
                Ya tengo cuenta → Iniciar sesión
              </button>
            </div>
          </div>
        </section>

        {/* FRANJA "ASÍ DE FÁCIL" (marquee continuo, ver @keyframes landing-marquee en index.css) */}
        <section className="py-3 bg-stone-50">
          <Reveal>
            <div className="overflow-hidden">
              <div className="landing-marquee-track flex w-max items-center gap-10 sm:gap-16">
                {[...EASY_STEPS, ...EASY_STEPS].map((step, i) => (
                  <div key={i} className="flex items-center gap-2 shrink-0">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-50 shrink-0">
                      <step.icon className="text-teal-600" size={14} strokeWidth={2} />
                    </span>
                    <span className="text-xs sm:text-sm text-stone-600 whitespace-nowrap">{step.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>

        {/* SCREENSHOTS */}
        <section className="px-5 py-12">
          <div className="max-w-[1024px] mx-auto">
            <Reveal>
              <h2 className="text-xl sm:text-2xl font-bold text-center text-stone-800">Tu dinero, con claridad</h2>
              <SectionTitleAccent />
            </Reveal>
            <Reveal>
              <div className="flex gap-4 overflow-x-auto pb-2 sm:justify-center sm:overflow-visible snap-x snap-mandatory sm:snap-none -mx-5 px-10 sm:mx-0 sm:px-0">
                {SCREENSHOTS.map((shot) => (
                  <div key={shot.src} className="flex-none snap-center flex flex-col items-center">
                    <DeviceFrame src={shot.src} alt={shot.caption} />
                    <span className="mt-3 inline-block bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium px-4 py-1 rounded-full">
                      {shot.caption}
                    </span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* DIFERENCIADORES */}
        <section className="px-5 py-12 bg-stone-50">
          <div className="max-w-[1024px] mx-auto">
            <Reveal>
              <h2 className="text-xl sm:text-2xl font-bold text-center text-stone-800">¿Por qué Nitid?</h2>
              <SectionTitleAccent />
            </Reveal>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-xl mx-auto">
              {DIFFERENTIATORS.map((item) => (
                <Reveal
                  key={item.title}
                  className="flex flex-col items-start p-4 rounded-2xl bg-white border border-stone-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <span className="flex items-center justify-center w-9 h-9 rounded-full bg-teal-50 shrink-0">
                    <item.icon className="text-teal-600" size={18} strokeWidth={1.75} />
                  </span>
                  <h3 className="mt-2 font-bold text-sm text-stone-800">{item.title}</h3>
                  <p className="mt-1 text-xs text-stone-500">{item.description}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* EMPIEZA GRATIS — tarjeta de plan única */}
        <section className="px-5 py-12">
          <div className="max-w-[1024px] mx-auto text-center">
            <Reveal>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-800">Empieza gratis. De verdad.</h2>
              <SectionTitleAccent />
              <p className="-mt-3 text-stone-500 text-sm">Sin trucos. Sin límite de tiempo.</p>
              <div className="mt-7 max-w-[400px] mx-auto bg-white border border-teal-400 rounded-2xl shadow-lg p-6 text-left">
                <div className="flex justify-center">
                  <span className="inline-block bg-teal-600 text-white text-sm font-semibold px-4 py-1 rounded-full">
                    Plan Gratuito · Para siempre
                  </span>
                </div>
                <div className="mt-5 flex flex-col">
                  {FREE_FEATURES.map((feature) => (
                    <CheckRow key={feature} text={feature} />
                  ))}
                </div>
                <div className="border-t border-stone-200 my-4" />
                <p className="text-center text-xs text-stone-400 italic">¿Necesitas más? Premium desde 2,50€/mes. Sin permanencia.</p>
              </div>
            </Reveal>
          </div>
        </section>

        {/* PRIVACIDAD (SIN BANCO) */}
        <section className="px-5 py-12 bg-teal-600 text-white">
          <div className="max-w-md mx-auto text-center flex flex-col items-center">
            <Reveal className="flex flex-col items-center">
              <Lock className="text-white" size={48} strokeWidth={1.5} />
              <h2 className="mt-4 text-xl sm:text-2xl font-bold">Sin conexión bancaria</h2>
              <p className="mt-3 text-teal-100 text-sm leading-relaxed">
                No pedimos acceso a tu banco ni a tus contraseñas bancarias. Tú introduces tus datos, tú decides qué registrar.
              </p>
            </Reveal>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="px-5 py-12 bg-stone-50 text-center">
          <div className="max-w-[1024px] mx-auto flex flex-col items-center">
            <Reveal className="flex flex-col items-center">
              <h2 className="text-xl font-bold text-stone-800 max-w-sm">Tus finanzas, con toda la claridad</h2>
              <a
                href={PLAY_STORE_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center justify-center rounded-xl bg-teal-600 px-6 py-3 text-white font-semibold text-base shadow-md hover:bg-teal-700 active:scale-[0.98] transition-all"
              >
                Descargar gratis en Google Play
              </a>
              <div className="mt-4 flex items-center gap-2">
                <img src="/icon-512.png" alt="Nitid" width={28} height={28} className="rounded-md" />
                <span className="text-xs text-stone-400">Disponible en Google Play</span>
              </div>
            </Reveal>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-stone-800 text-stone-400 px-5 py-8 text-sm">
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
    </div>
  );
}
