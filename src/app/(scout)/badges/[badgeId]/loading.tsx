import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-5 w-28" />
      <Skeleton className="h-52 rounded-2xl" />
      <div className="space-y-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
