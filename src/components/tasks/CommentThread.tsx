"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import Avatar from "@/components/ui/Avatar";
import type { Comment } from "@/types";

interface Props {
  taskId: string;
  initialComments: Comment[];
  currentUserId: string;
}

export default function CommentThread({ taskId, initialComments, currentUserId }: Props) {
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    const content = text.trim();
    if (!content) return;
    setSending(true);
    try {
      const res = await fetch("/api/tasks/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, taskId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error();
      setComments((prev) => [...prev, data.data]);
      setText("");
    } catch {
      toast.error("Error sending comment");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-4">
        Comments <span className="font-normal normal-case text-gray-300 ml-1">{comments.length}</span>
      </p>

      <div className="space-y-4 mb-4">
        {comments.map((c) => (
          <div key={c.id} className="flex gap-3">
            <Avatar user={c.author ?? { name: null, image: null }} size="md" className="mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-sm font-medium text-gray-800">{c.author?.name}</span>
                <span className="text-xs text-gray-400">
                      {new Date(c.createdAt).toLocaleDateString("it", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
              </div>
              <div className="text-sm text-gray-700 bg-gray-50 rounded-t-none rounded-lg rounded-tl-none px-3 py-2 leading-relaxed">
                {c.content}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-3 items-start">
        <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-[10px] text-white font-medium flex-shrink-0 mt-0.5">
          Me
        </div>
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(); }}
            placeholder="Write a comment... (Cmd+Enter to send)"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 resize-none outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 placeholder:text-gray-300 transition-all min-h-[38px]"
            rows={1}
          />
          {text.trim() && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={send}
                disabled={sending}
                className="text-xs bg-accent text-white px-3 py-1.5 rounded-md hover:opacity-90 disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send"}
              </button>
              <button onClick={() => setText("")} className="text-xs text-gray-400 px-2 py-1.5 hover:text-gray-600">
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
