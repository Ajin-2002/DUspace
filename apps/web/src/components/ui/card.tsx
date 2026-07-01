import { cn } from "@/lib/utils";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
};

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/80 p-5 shadow-sm backdrop-blur-sm dark:bg-white/5",
        hover &&
          "cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10",
        className
      )}
    >
      {children}
    </div>
  );
}

type AppCardProps = {
  name: string;
  developer: string;
  category: string;
  rating: number;
  downloads: string;
  icon: string;
  className?: string;
};

export function AppCard({
  name,
  developer,
  category,
  rating,
  downloads,
  icon,
  className,
}: AppCardProps) {
  return (
    <Card hover className={cn("flex flex-col gap-3", className)}>
      {/* Icon */}
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0F3B5C] to-[#2D7FF9] text-2xl shadow-md">
        {icon}
      </div>

      {/* Info */}
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900 dark:text-white">{name}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">{developer}</p>
        <p className="mt-1 text-xs font-medium text-[#2D7FF9]">{category}</p>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-white/10 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <span className="text-amber-400">★</span>
          {rating.toFixed(1)}
        </span>
        <span>{downloads}</span>
      </div>
    </Card>
  );
}
