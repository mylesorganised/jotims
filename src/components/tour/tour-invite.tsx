"use client";

import { useEffect, useState } from "react";
import { Compass, X } from "lucide-react";
import { getTour } from "@/lib/tour/registry";
import { buttonClass } from "../ui";
import { useTour } from "./tour";

/** A one-time "New here? Take the tour" card. Remembers in this browser once dismissed. */
export function TourInvite({ tourId, heading, text }: { tourId: string; heading: string; text: string }) {
  const tour = useTour();
  const key = `joti:tour-invite:${tourId}`;
  const [show, setShow] = useState(false);

  // Read the "seen" flag after hydration so server and client HTML match.
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!localStorage.getItem(key)) setShow(true);
    } catch {}
  }, [key]);

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(key, "1");
    } catch {}
  };

  if (!show || !tour || !getTour(tourId)) return null;

  return (
    <div className="flex animate-fade-up flex-wrap items-center gap-4 rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200 sm:p-5">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
        <Compass className="size-6" />
      </span>
      <div className="min-w-48 flex-1">
        <p className="font-extrabold text-amber-950">{heading}</p>
        <p className="text-sm text-amber-900/80">{text}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            dismiss();
            tour.startTour(tourId);
          }}
          className={buttonClass("primary", "md")}
        >
          <Compass className="size-4" /> Show me around
        </button>
        <button type="button" onClick={dismiss} className="grid size-9 place-items-center rounded-lg text-amber-800 hover:bg-amber-100" aria-label="No thanks">
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
