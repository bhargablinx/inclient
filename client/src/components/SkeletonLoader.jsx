export const CardSkeleton = () => (
    <div className="rounded-xl border bg-card p-6 shadow-sm animate-pulse space-y-3">
        <div className="h-4 w-1/3 bg-slate-200 rounded" />
        <div className="h-8 w-2/3 bg-slate-200 rounded" />
        <div className="h-3 w-1/2 bg-slate-200 rounded" />
    </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
    <div className="rounded-lg border bg-card p-4 space-y-3 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-full mb-4" />
        {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
                <div className="h-4 w-1/4 bg-slate-200 rounded" />
                <div className="h-4 w-1/6 bg-slate-200 rounded" />
                <div className="h-4 w-1/6 bg-slate-200 rounded" />
                <div className="h-4 w-1/5 bg-slate-200 rounded" />
            </div>
        ))}
    </div>
);

export const DashboardSkeleton = () => (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
        </div>
        <TableSkeleton rows={6} />
    </div>
);
