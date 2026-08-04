interface ArticleBannerProps {
  title: string;
  subtitle: string;
  date: string;
}

export function ArticleBanner({ title, subtitle, date }: ArticleBannerProps) {
  return (
    <div>
      <div className="rounded-2xl bg-teal-600 text-white px-6 py-10 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{title}</h1>
        <p className="mt-3 text-teal-50 text-sm sm:text-base leading-relaxed">{subtitle}</p>
      </div>
      <p className="mt-3 text-xs text-stone-400">
        {date} · por Nitid Apps
      </p>
    </div>
  );
}
