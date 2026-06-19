import { Fragment } from "react";

/** Lightweight Markdown renderer for headings, bold, lists, and paragraphs. */
export function Markdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];

  const flushList = (key: string) => {
    if (list.length) {
      blocks.push(
        <ul key={key} className="my-2 list-disc space-y-1 pl-5 text-sm text-foreground/90">
          {list.map((item, i) => (
            <li key={i}>{inline(item)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    if (line.startsWith("### ")) {
      flushList(`l-${idx}`);
      blocks.push(<h4 key={idx} className="mt-4 mb-1 font-display text-sm font-semibold">{inline(line.slice(4))}</h4>);
    } else if (line.startsWith("## ")) {
      flushList(`l-${idx}`);
      blocks.push(<h3 key={idx} className="mt-5 mb-2 font-display text-lg font-bold text-primary">{inline(line.slice(3))}</h3>);
    } else if (line.startsWith("# ")) {
      flushList(`l-${idx}`);
      blocks.push(<h2 key={idx} className="mt-2 mb-3 font-display text-xl font-bold">{inline(line.slice(2))}</h2>);
    } else if (/^[-*]\s+/.test(line)) {
      list.push(line.replace(/^[-*]\s+/, ""));
    } else if (line.trim() === "") {
      flushList(`l-${idx}`);
    } else {
      flushList(`l-${idx}`);
      blocks.push(<p key={idx} className="my-1.5 text-sm leading-relaxed text-foreground/90">{inline(line)}</p>);
    }
  });
  flushList("last");

  return <div className="print:text-black">{blocks}</div>;
}

function inline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="font-semibold text-foreground">{p.slice(2, -2)}</strong>
    ) : (
      <Fragment key={i}>{p}</Fragment>
    ),
  );
}
