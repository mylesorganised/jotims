import { Lightbulb, RadioTower, Wifi } from "lucide-react";
import type { BadgeDef } from "@/content/types";
import { cn } from "./ui";

const icons = {
  communicator: RadioTower,
  "digital-citizen": Wifi,
  "digital-maker": Lightbulb,
};

/** Round badge drawn in the badge's own colours, with the stage number. */
export function BadgeEmblem({
  badge,
  size = 64,
  dim = false,
  className,
}: {
  badge: BadgeDef;
  size?: number;
  dim?: boolean;
  className?: string;
}) {
  const Icon = icons[badge.family];
  const ring = Math.max(3, Math.round(size * 0.08));
  return (
    <div
      className={cn("relative shrink-0 rounded-full", dim && "opacity-60 grayscale-[35%]", className)}
      style={{ width: size, height: size, background: badge.ring, padding: ring }}
      aria-hidden
    >
      <div
        className="grid h-full w-full place-items-center rounded-full"
        style={{
          background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${badge.color} 80%, white), ${badge.color} 70%)`,
          boxShadow: "inset 0 -2px 6px rgb(0 0 0 / 0.15)",
        }}
      >
        <Icon style={{ color: badge.ink, width: size * 0.42, height: size * 0.42 }} strokeWidth={2.4} />
      </div>
      {badge.stage && (
        <span
          className="absolute grid place-items-center rounded-full bg-white font-extrabold shadow-sm"
          style={{
            width: size * 0.36,
            height: size * 0.36,
            right: -size * 0.02,
            bottom: -size * 0.02,
            color: badge.ring,
            fontSize: size * 0.2,
            boxShadow: `0 0 0 ${Math.max(2, size * 0.035)}px ${badge.ring}`,
          }}
        >
          {badge.stage}
        </span>
      )}
    </div>
  );
}
