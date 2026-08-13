import { PLAY_STORE_URL } from "../lib/constants";

export function GooglePlayBadge({ className = "" }: { className?: string }) {
  return (
    <a href={PLAY_STORE_URL} target="_blank" rel="noreferrer" className={`inline-block w-full max-w-[200px] ${className}`}>
      <img
        src="https://play.google.com/intl/en_us/badges/static/images/badges/es_badge_web_generic.png"
        alt="Disponible en Google Play"
        width={646}
        height={250}
        className="w-full h-auto"
      />
    </a>
  );
}
