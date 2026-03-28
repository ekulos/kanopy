"use client";

import dynamic from "next/dynamic";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });
const MDPreview = dynamic(
  () => import("@uiw/react-markdown-preview").then((mod) => mod.default),
  { ssr: false }
);

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
}

interface PreviewProps {
  content: string;
  className?: string;
}

export function MarkdownEditor({ value, onChange, placeholder, minHeight = 120 }: EditorProps) {
  return (
    <div data-color-mode="light">
      <MDEditor
        value={value}
        onChange={(v) => onChange(v ?? "")}
        preview="edit"
        hideToolbar={false}
        visibleDragbar={false}
        textareaProps={{ placeholder: placeholder ?? "Write the description in Markdown..." }}
        style={{ minHeight, fontSize: 14 }}
      />
    </div>
  );
}

export function MarkdownPreview({ content, className }: PreviewProps) {
  if (!content) return null;
  return (
    <div data-color-mode="light" className={className}>
      <MDPreview
        source={content}
        style={{ fontSize: 13, background: "transparent", padding: 0 }}
        wrapperElement={{ "data-color-mode": "light" } as React.HTMLAttributes<HTMLDivElement>}
      />
    </div>
  );
}
