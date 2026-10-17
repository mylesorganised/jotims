import "server-only";
import { unzipSync, strFromU8 } from "fflate";

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

function decode(text: string) {
  return text.replace(/&(#x?[0-9a-f]+|\w+);/gi, (m, e: string) =>
    e[0] === "#" ? String.fromCodePoint(parseInt(e.slice(e[1] === "x" ? 2 : 1), e[1] === "x" ? 16 : 10)) : (ENTITIES[e] ?? m),
  );
}

/**
 * The words on each slide of a .pptx, plus how many pictures each has, so the
 * AI leader can read slides it can't open. Returns null if it isn't a deck.
 */
export function slideText(bytes: Uint8Array, maxChars = 2000): string | null {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes, { filter: (f) => /^ppt\/slides\/slide\d+\.xml$/.test(f.name) && f.originalSize < 5_000_000 });
  } catch {
    return null;
  }
  const slides = Object.keys(files)
    .map((name) => ({ n: Number(name.match(/slide(\d+)\.xml$/)![1]), xml: strFromU8(files[name]) }))
    .sort((a, b) => a.n - b.n);
  if (!slides.length) return null;

  const lines = slides.map((s, i) => {
    const paragraphs = [...s.xml.matchAll(/<a:p>([\s\S]*?)<\/a:p>/g)]
      .map((p) => decode([...p[1].matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((t) => t[1]).join("")).trim())
      .filter(Boolean);
    const pictures = (s.xml.match(/<p:pic>/g) ?? []).length;
    const words = paragraphs.join(" / ") || "(no text)";
    return `Slide ${i + 1}: ${words}${pictures ? ` [${pictures} picture${pictures > 1 ? "s" : ""}]` : ""}`;
  });
  const all = lines.join("\n");
  return `${slides.length} slide${slides.length > 1 ? "s" : ""}.\n${all.length > maxChars ? `${all.slice(0, maxChars)}…` : all}`;
}
