import { Fragment, type ReactNode } from "react";

/** Tiny formatter for walkthrough text: **bold**, *italic* and `code`. */
export function RichText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(<Fragment key={i++}>{text.slice(last, m.index)}</Fragment>);
    const token = m[0];
    if (token.startsWith("**")) parts.push(<strong key={i++} className="font-bold text-ink">{token.slice(2, -2)}</strong>);
    else if (token.startsWith("`")) parts.push(<code key={i++} className="prose-code">{token.slice(1, -1)}</code>);
    else parts.push(<em key={i++}>{token.slice(1, -1)}</em>);
    last = m.index + token.length;
  }
  if (last < text.length) parts.push(<Fragment key={i++}>{text.slice(last)}</Fragment>);
  return <>{parts}</>;
}
