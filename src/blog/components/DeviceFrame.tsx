// Mismo marco de dispositivo que usa la landing (src/components/LandingPage.tsx), fijado a
// max-width 220px para encajar dentro de las tarjetas de artículo (más estrechas que la landing).
export function DeviceFrame({
  src,
  alt,
  width,
  height,
  className = "",
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}) {
  return (
    <div className={`w-full max-w-[220px] rounded-[24px] border border-stone-200 shadow-xl bg-white overflow-hidden ${className}`}>
      <div className="flex items-center justify-center gap-1.5 py-2 bg-white">
        <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
        <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
        <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
      </div>
      <img src={src} alt={alt} width={width} height={height} loading="lazy" className="w-full block object-contain" />
    </div>
  );
}
