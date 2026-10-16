import { Skeleton } from "@/components/ui";

export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-5 w-40" />
      <div className="flex gap-4">
        <Skeleton className="size-16 rounded-2xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[15rem_1fr]">
        <Skeleton className="hidden h-64 lg:block" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    </div>
  );
}
