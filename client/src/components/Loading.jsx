import { DashboardSkeleton } from "./SkeletonLoader";

export default function Loading() {
    return (
        <div className="p-6 max-w-7xl mx-auto w-full">
            <DashboardSkeleton />
        </div>
    );
}
