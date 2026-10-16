import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-10">
      <Skeleton className="h-56 rounded-3xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
