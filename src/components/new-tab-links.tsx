"use client";

import { useEffect } from "react";

/**
 * Safety net: any link that leaves the app (another website, a printable
 * sheet or an uploaded file) opens in a new tab, so young people never lose
 * their place, even if a link was added without target="_blank".
 */
export function NewTabLinks() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      const link = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const url = new URL(link.href, window.location.href);
      if (!/^https?:$/.test(url.protocol)) return;
      const leavesApp = url.origin !== window.location.origin;
      const isFile = url.pathname.startsWith("/resources/") || url.pathname.startsWith("/api/files/");
      if (!leavesApp && !isFile) return;
      event.preventDefault();
      window.open(url.href, "_blank", "noopener,noreferrer");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);
  return null;
}
