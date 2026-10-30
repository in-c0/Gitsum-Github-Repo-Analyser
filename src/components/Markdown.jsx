import { useMemo } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";

marked.setOptions({ gfm: true, breaks: false });

/** Renders AI/README markdown safely. Links open in a new tab. */
const Markdown = ({ text, className = "" }) => {
  const html = useMemo(() => {
    const raw = marked.parse(text || "", { async: false });
    const clean = DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });
    return clean.replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" ');
  }, [text]);
  return <div className={`prose-gs ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
};

export default Markdown;
