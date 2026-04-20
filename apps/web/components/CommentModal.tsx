import React, { useEffect, useRef, useState, useCallback } from "react";

/* ─────────────────────────── Types ─────────────────────────── */

type CommentStatus = "pending" | "review" | "approved" | "rejected";

interface CommentDoc {
  _id: string;
  pageId: string;
  componentCid: string;
  parentId: string | null;
  text: string;
  authorEmail: string;
  authorName: string;
  status: CommentStatus | null;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
  component: any;
  pageId?: string;
};

/* ─────────── Status styling map ─────────── */
const STATUS_META: Record<
  CommentStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  pending: {
    label: "Pending",
    bg: "#fef3c7",
    text: "#92400e",
    border: "#fbbf24",
  },
  review: {
    label: "Review",
    bg: "#dbeafe",
    text: "#1e40af",
    border: "#60a5fa",
  },
  approved: {
    label: "Approved",
    bg: "#d1fae5",
    text: "#065f46",
    border: "#34d399",
  },
  rejected: {
    label: "Rejected",
    bg: "#fee2e2",
    text: "#991b1b",
    border: "#f87171",
  },
};

/* ─────────── Helpers ─────────── */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function initials(name: string): string {
  return name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join("");
}

/* ─────────── Component ─────────── */

const CommentsModal = ({ isOpen, onClose, component, pageId }: Props) => {
  const [comments, setComments] = useState<CommentDoc[]>([]);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const replyRef = useRef<HTMLTextAreaElement>(null);

  const cid = component?.component?.cid;

  /* ─── Fetch comments ─── */
  const fetchComments = useCallback(async () => {
    if (!pageId || !cid) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ pageId, componentCid: cid });
      const res = await fetch(`/api/comments?${params}`);
      const data = await res.json();
      if (Array.isArray(data)) setComments(data);
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  }, [pageId, cid]);

  useEffect(() => {
    if (isOpen) fetchComments();
  }, [isOpen, fetchComments]);

  // Auto-focus textarea when modal opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setCommentText("");
      setReplyingTo(null);
      setReplyText("");
    }
  }, [isOpen]);

  /* ─── Post comment ─── */
  const handlePost = async (parentId?: string) => {
    const text = parentId ? replyText : commentText;
    if (!text.trim() || !pageId || !cid) return;
    setPosting(true);
    try {
      await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId, componentCid: cid, text, parentId }),
      });
      if (parentId) {
        setReplyText("");
        setReplyingTo(null);
      } else {
        setCommentText("");
      }
      await fetchComments();
    } catch {
      /* silently fail */
    } finally {
      setPosting(false);
    }
  };

  /* ─── Toggle resolved ─── */
  const toggleResolved = async (comment: CommentDoc) => {
    try {
      await fetch(`/api/comments/${comment._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isResolved: !comment.isResolved }),
      });
      await fetchComments();
    } catch {
      /* silently fail */
    }
  };

  /* ─── Update status ─── */
  const updateStatus = async (commentId: string, status: CommentStatus) => {
    try {
      await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await fetchComments();
    } catch {
      /* silently fail */
    }
  };

  /* ─── Delete ─── */
  const deleteComment = async (commentId: string) => {
    if (!confirm("Delete this comment?")) return;
    try {
      await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
      await fetchComments();
    } catch {
      /* silently fail */
    }
  };

  /* ─── Keyboard shortcuts ─── */
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    parentId?: string,
  ) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handlePost(parentId);
    }
    if (e.key === "Escape") onClose();
  };

  /* ─── Thread structure ─── */
  const rootComments = comments.filter((c) => !c.parentId);
  const getReplies = (parentId: string) =>
    comments.filter((c) => c.parentId === parentId);

  if (!isOpen) return null;

  const noPageId = !pageId;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          background: "rgba(0,0,0,0.08)",
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          right: "24px",
          transform: "translateY(-50%)",
          zIndex: 9999,
          width: "400px",
          maxHeight: "80vh",
          background: "#ffffff",
          borderRadius: "12px",
          boxShadow:
            "0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)",
          border: "1.5px solid #e2e8f0",
          display: "flex",
          flexDirection: "column",
          animation: "commentBoxFadeIn 0.2s ease",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            padding: "14px 16px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6366f1"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            <span
              style={{ fontSize: "14px", fontWeight: 700, color: "#1e293b" }}
            >
              Comments
            </span>
            <span
              style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 500 }}
            >
              {rootComments.length > 0 ? `${rootComments.length}` : ""}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#94a3b8",
              padding: "4px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Thread list ── */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "8px 16px",
            minHeight: 0,
          }}
        >
          {noPageId && (
            <div
              style={{
                padding: "16px",
                textAlign: "center",
                color: "#94a3b8",
                fontSize: "12px",
              }}
            >
              Save the page first to enable commenting.
            </div>
          )}

          {loading && (
            <div
              style={{
                padding: "16px",
                textAlign: "center",
                color: "#94a3b8",
                fontSize: "12px",
              }}
            >
              Loading comments…
            </div>
          )}

          {!loading && !noPageId && rootComments.length === 0 && (
            <div
              style={{
                padding: "24px 16px",
                textAlign: "center",
                color: "#94a3b8",
                fontSize: "12px",
              }}
            >
              No comments yet. Start the conversation!
            </div>
          )}

          {rootComments.map((comment) => {
            const replies = getReplies(comment._id);
            const statusMeta = comment.status
              ? STATUS_META[comment.status]
              : null;

            return (
              <div
                key={comment._id}
                style={{
                  marginBottom: "12px",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #f1f5f9",
                  background: comment.isResolved ? "#f8fafcaa" : "#fff",
                  opacity: comment.isResolved ? 0.7 : 1,
                  transition: "all 0.15s",
                }}
              >
                {/* Author row */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "6px",
                  }}
                >
                  <div
                    style={{
                      width: "26px",
                      height: "26px",
                      borderRadius: "50%",
                      background:
                        "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "10px",
                      flexShrink: 0,
                    }}
                  >
                    {initials(comment.authorName)}
                  </div>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#1e293b",
                    }}
                  >
                    {comment.authorName}
                  </span>
                  <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                    {timeAgo(comment.createdAt)}
                  </span>

                  {/* Status badge */}
                  {statusMeta && (
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: "9px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        border: `1px solid ${statusMeta.border}`,
                        background: statusMeta.bg,
                        color: statusMeta.text,
                      }}
                    >
                      {statusMeta.label}
                    </span>
                  )}
                </div>

                {/* Text */}
                <p
                  style={{
                    margin: "0 0 8px 34px",
                    fontSize: "13px",
                    lineHeight: "1.5",
                    color: "#334155",
                    textDecoration: comment.isResolved
                      ? "line-through"
                      : "none",
                  }}
                >
                  {comment.text}
                </p>

                {/* Resolved badge */}
                {comment.isResolved && (
                  <span
                    style={{
                      marginLeft: "34px",
                      fontSize: "10px",
                      fontWeight: 600,
                      color: "#059669",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "3px",
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Resolved
                  </span>
                )}

                {/* Actions */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginTop: "6px",
                    marginLeft: "34px",
                    flexWrap: "wrap",
                  }}
                >
                  {/* Reply button */}
                  <button
                    onClick={() =>
                      setReplyingTo(
                        replyingTo === comment._id ? null : comment._id,
                      )
                    }
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "11px",
                      color: "#6366f1",
                      cursor: "pointer",
                      fontWeight: 500,
                      padding: "2px 4px",
                    }}
                  >
                    Reply
                  </button>

                  {/* Resolve button (root only) */}
                  <button
                    onClick={() => toggleResolved(comment)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "11px",
                      color: comment.isResolved ? "#94a3b8" : "#059669",
                      cursor: "pointer",
                      fontWeight: 500,
                      padding: "2px 4px",
                    }}
                  >
                    {comment.isResolved ? "Unresolve" : "Resolve"}
                  </button>

                  {/* Status dropdown */}
                  <select
                    value={comment.status || "pending"}
                    onChange={(e) =>
                      updateStatus(
                        comment._id,
                        e.target.value as CommentStatus,
                      )
                    }
                    style={{
                      fontSize: "10px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "4px",
                      padding: "1px 4px",
                      color: "#64748b",
                      background: "#fafbfc",
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="review">Review</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>

                  {/* Delete */}
                  <button
                    onClick={() => deleteComment(comment._id)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: "11px",
                      color: "#ef4444",
                      cursor: "pointer",
                      fontWeight: 500,
                      padding: "2px 4px",
                      marginLeft: "auto",
                    }}
                  >
                    Delete
                  </button>
                </div>

                {/* Replies */}
                {replies.length > 0 && (
                  <div
                    style={{
                      marginLeft: "34px",
                      marginTop: "10px",
                      borderLeft: "2px solid #e2e8f0",
                      paddingLeft: "12px",
                    }}
                  >
                    {replies.map((reply) => (
                      <div
                        key={reply._id}
                        style={{
                          marginBottom: "8px",
                          padding: "8px",
                          borderRadius: "6px",
                          background: "#f8fafc",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            marginBottom: "4px",
                          }}
                        >
                          <div
                            style={{
                              width: "20px",
                              height: "20px",
                              borderRadius: "50%",
                              background:
                                "linear-gradient(135deg, #a5b4fc, #c4b5fd)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontWeight: 700,
                              fontSize: "8px",
                              flexShrink: 0,
                            }}
                          >
                            {initials(reply.authorName)}
                          </div>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              color: "#334155",
                            }}
                          >
                            {reply.authorName}
                          </span>
                          <span style={{ fontSize: "9px", color: "#94a3b8" }}>
                            {timeAgo(reply.createdAt)}
                          </span>
                          <button
                            onClick={() => deleteComment(reply._id)}
                            style={{
                              marginLeft: "auto",
                              background: "none",
                              border: "none",
                              fontSize: "10px",
                              color: "#ef4444",
                              cursor: "pointer",
                              padding: "1px 3px",
                            }}
                          >
                            ✕
                          </button>
                        </div>
                        <p
                          style={{
                            margin: "0 0 0 26px",
                            fontSize: "12px",
                            lineHeight: "1.5",
                            color: "#475569",
                          }}
                        >
                          {reply.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply input */}
                {replyingTo === comment._id && (
                  <div
                    style={{
                      marginTop: "8px",
                      marginLeft: "34px",
                      display: "flex",
                      gap: "6px",
                    }}
                  >
                    <textarea
                      ref={replyRef}
                      autoFocus
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, comment._id)}
                      placeholder="Write a reply…"
                      rows={2}
                      style={{
                        flex: 1,
                        border: "1px solid #e2e8f0",
                        borderRadius: "6px",
                        padding: "6px 10px",
                        fontSize: "12px",
                        color: "#334155",
                        resize: "none",
                        outline: "none",
                        fontFamily: "inherit",
                        lineHeight: "1.5",
                        background: "#fafbfc",
                      }}
                    />
                    <button
                      onClick={() => handlePost(comment._id)}
                      disabled={!replyText.trim() || posting}
                      style={{
                        alignSelf: "flex-end",
                        padding: "5px 10px",
                        borderRadius: "5px",
                        border: "none",
                        background: replyText.trim()
                          ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                          : "#e2e8f0",
                        color: replyText.trim() ? "#fff" : "#94a3b8",
                        fontSize: "11px",
                        fontWeight: 600,
                        cursor: replyText.trim() ? "pointer" : "not-allowed",
                      }}
                    >
                      Reply
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Composer ── */}
        {!noPageId && (
          <div
            style={{
              borderTop: "1px solid #f1f5f9",
              padding: "12px 16px",
              flexShrink: 0,
            }}
          >
            <textarea
              ref={textareaRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => handleKeyDown(e)}
              placeholder="Add a comment…"
              rows={2}
              style={{
                width: "100%",
                border: "1.5px solid #e2e8f0",
                borderRadius: "6px",
                padding: "8px 12px",
                fontSize: "13px",
                color: "#334155",
                resize: "none",
                outline: "none",
                fontFamily: "inherit",
                lineHeight: "1.5",
                background: "#fafbfc",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#6366f1";
                e.target.style.background = "#fff";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.background = "#fafbfc";
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: "8px",
              }}
            >
              <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                <kbd
                  style={{
                    background: "#f1f5f9",
                    padding: "1px 4px",
                    borderRadius: "3px",
                    fontFamily: "monospace",
                    fontSize: "9px",
                  }}
                >
                  Ctrl+Enter
                </kbd>{" "}
                to submit
              </span>
              <button
                onClick={() => handlePost()}
                disabled={!commentText.trim() || posting}
                style={{
                  padding: "6px 18px",
                  borderRadius: "6px",
                  border: "none",
                  background: commentText.trim()
                    ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                    : "#e2e8f0",
                  color: commentText.trim() ? "#fff" : "#94a3b8",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: commentText.trim() ? "pointer" : "not-allowed",
                  transition: "all 0.15s",
                  boxShadow: commentText.trim()
                    ? "0 2px 8px rgba(99,102,241,0.25)"
                    : "none",
                }}
              >
                {posting ? "Posting…" : "Comment"}
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes commentBoxFadeIn {
          from { opacity: 0; transform: translateY(calc(-50% - 10px)); }
          to   { opacity: 1; transform: translateY(-50%); }
        }
      `}</style>
    </>
  );
};

export default CommentsModal;
