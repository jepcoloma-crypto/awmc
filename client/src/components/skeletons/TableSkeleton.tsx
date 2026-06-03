interface Props {
  rows?: number;
  columns?: number;
}

export default function TableSkeleton({ rows = 8, columns = 5 }: Props) {
  return (
    <div className="animate-pulse space-y-3">
      <div className="flex gap-4 pb-2 border-b border-gray-200 dark:border-gray-700">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded" style={{ width: `${80 + Math.random() * 20}%` }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 py-2">
          {Array.from({ length: columns }).map((_, c) => (
            <div key={c} className="h-3.5 bg-gray-100 dark:bg-gray-700/50 rounded" style={{ width: `${70 + Math.random() * 30}%` }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-4">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
      <div className="h-8 bg-gray-100 dark:bg-gray-700/50 rounded w-1/2" />
      <div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded w-2/3" />
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
      <div className="h-8 bg-gray-100 dark:bg-gray-700/50 rounded w-1/2 mb-2" />
      <div className="h-3 bg-gray-100 dark:bg-gray-700/50 rounded w-1/4" />
    </div>
  );
}
