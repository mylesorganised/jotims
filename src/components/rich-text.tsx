import { Fragment, type ReactNode } from "react";

// [links](https://…), **bold**, *italic*, `code`, and web addresses like makecode.microbit.org
const TOKENS =
  /(\[[^\]]+\]\(https?:\/\/[^)\s]+\)|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|https?:\/\/[^\s)]+|\b(?:[a-z0-9-]+\.)+(?:org\.uk|co\.uk|org|com|edu|io|info|net|garden)(?:\/[^\s)]*)?)/gi;

function webLink(raw: string, key: number) {
  // Leave sentence punctuation outside the link: "go to makecode.microbit.org."
  const text = raw.replace(/[.,;:!?]+$/, "");
  const trailing = raw.slice(text.length);
  const href = /^https?:\/\//i.test(text) ? text : `https://${text}`;
  return (
    <Fragment key={key}>
      <a href={href} target="_blank" rel="noopener noreferrer" className="font-bold text-brand-700 underline decoration-brand-300 underline-offset-2 hover:decoration-brand-600">
        {text}
      </a>
      {trailing}
    </Fragment>
  );
}

/** Tiny formatter for walkthrough text. Web addresses open in a new tab. */
export function RichText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(TOKENS)) {
    const index = m.index ?? 0;
    if (index > last) parts.push(<Fragment key={i++}>{text.slice(last, index)}</Fragment>);
    const token = m[0];
    const md = token.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
    if (md) parts.push(
      <a key={i++} href={md[2]} target="_blank" rel="noopener noreferrer" className="font-bold text-brand-700 underline decoration-brand-300 underline-offset-2 hover:decoration-brand-600">
        {md[1]}
      </a>,
    );
    else if (token.startsWith("**")) parts.push(<strong key={i++} className="font-bold text-ink">{token.slice(2, -2)}</strong>);
    else if (token.startsWith("`")) parts.push(<code key={i++} className="prose-code">{token.slice(1, -1)}</code>);
    else if (token.startsWith("*")) parts.push(<em key={i++}>{token.slice(1, -1)}</em>);
    else parts.push(webLink(token, i++));
    last = index + token.length;
  }
  if (last < text.length) parts.push(<Fragment key={i++}>{text.slice(last)}</Fragment>);
  return <>{parts}</>;
}
