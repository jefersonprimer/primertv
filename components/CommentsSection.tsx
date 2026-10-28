"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useTranslations, useFormatter, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import {
  User,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Reply,
  X,
  Pencil,
  Trash2,
  Check,
  ChevronDown,
  ArrowUpDown,
} from "lucide-react";

interface CommentItem {
  id: string;
  targetId: string;
  parentId?: string | null;
  content: string;
  userId?: string;
  userUsername?: string | null;
  visitorId?: string;
  userName: string;
  userImage?: string | null;
  createdAt: string | Date;
  isEdited?: boolean;
  likes: number;
  dislikes: number;
  likedBy: string[];
  dislikedBy: string[];
}

interface CommentsSectionProps {
  targetId: string;
  currentUser?: {
    id: string;
    name: string;
    email?: string;
    image?: string | null;
  } | null;
}

interface CommentFormProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
  placeholder: string;
  submitting: boolean;
  submitText: string;
  onCancel?: () => void;
  cancelText?: string;
  error?: string | null;
  currentUser?: {
    id?: string;
    name?: string;
    email?: string;
    image?: string | null;
  } | null;
  authorName?: string;
  onAuthorNameChange?: (name: string) => void;
  authorLabel?: string;
  authorPlaceholder?: string;
  isReply?: boolean;
}

function CommentForm({
  value,
  onChange,
  onSubmit,
  placeholder,
  submitting,
  submitText,
  onCancel,
  cancelText,
  error,
  currentUser,
  authorName,
  onAuthorNameChange,
  authorLabel,
  authorPlaceholder,
  isReply = false,
}: CommentFormProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  useEffect(() => {
    if (!value && textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(e);
      }}
      className="space-y-3"
    >
      {!currentUser && onAuthorNameChange && (
        <div>
          {authorLabel && (
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              {authorLabel}
            </label>
          )}
          <input
            type="text"
            placeholder={authorPlaceholder}
            value={authorName || ""}
            onChange={(e) => onAuthorNameChange(e.target.value)}
            className="w-full max-w-md rounded-none border-0 border-b border-zinc-800 bg-transparent px-0 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-white focus:outline-none focus:ring-0 transition-colors"
          />
        </div>
      )}

      <div className="flex gap-3 items-start">
        {/* User avatar */}
        <div
          className={`flex shrink-0 items-center justify-center rounded-full font-bold text-zinc-300 overflow-hidden bg-zinc-800 border border-zinc-700/50 mt-0.5 ${
            isReply ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm"
          }`}
        >
          {currentUser?.image ? (
            <img
              src={currentUser.image}
              alt={currentUser.name || "User"}
              className="h-full w-full object-cover"
            />
          ) : currentUser?.name ? (
            currentUser.name.charAt(0).toUpperCase()
          ) : (
            <User className={isReply ? "h-3.5 w-3.5" : "h-4 w-4"} />
          )}
        </div>

        {/* Input & actions */}
        <div className="flex-1 min-w-0 space-y-2">
          <textarea
            ref={textareaRef}
            rows={1}
            placeholder={placeholder}
            value={value}
            onChange={handleInput}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                if (!submitting && value.trim()) {
                  onSubmit();
                }
              }
            }}
            className="w-full resize-none rounded-none border-0 border-b border-zinc-800 bg-transparent px-0 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-white focus:outline-none focus:ring-0 transition-colors overflow-hidden"
          />

          {error && <p className="text-xs text-red-400 font-medium">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-1">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
              >
                {cancelText || "Cancelar"}
              </button>
            )}

            <button
              type="submit"
              disabled={submitting || !value.trim()}
              className={`inline-flex items-center justify-center gap-2 rounded-full bg-zinc-100 font-semibold text-zinc-900 shadow-sm transition-all hover:bg-white active:scale-95 disabled:cursor-not-allowed disabled:bg-zinc-800/80 disabled:text-zinc-500 disabled:shadow-none ${
                isReply ? "px-4 py-1.5 text-xs" : "px-5 py-2.5 text-sm"
              }`}
            >
              {submitting ? (
                <>
                  <Loader2
                    className={`${isReply ? "h-3.5 w-3.5" : "h-4 w-4"} animate-spin`}
                  />
                  <span>{submitText}</span>
                </>
              ) : (
                <span>{submitText}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

export function CommentsSection({
  targetId,
  currentUser,
}: CommentsSectionProps) {
  const t = useTranslations("Comments");
  const format = useFormatter();
  const locale = useLocale();

  const sortTopLabel =
    locale === "pt-br"
      ? "Principais"
      : locale === "es"
        ? "Principales"
        : locale === "fr"
          ? "Meilleurs"
          : locale === "de"
            ? "Beliebteste"
            : locale === "ar"
              ? "الأبرز"
              : "Top comments";

  const sortNewestLabel =
    locale === "pt-br"
      ? "Mais recentes"
      : locale === "es"
        ? "Más recientes"
        : locale === "fr"
          ? "Plus récents"
          : locale === "de"
            ? "Neueste"
            : locale === "ar"
              ? "الأحدث"
              : "Newest";

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sort state ("top" = mais curtidas/respostas, "newest" = mais recentes)
  const [sortBy, setSortBy] = useState<"top" | "newest">("top");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Visitor ID for guest votes & comments
  const [visitorId, setVisitorId] = useState<string>("");

  // Reply state
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyAuthorName, setReplyAuthorName] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<
    Record<string, boolean>
  >({});

  const toggleExpandReplies = (commentId: string) => {
    setExpandedReplies((prev) => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Track reaction pending per comment
  const [reactingIds, setReactingIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let id = localStorage.getItem("comment_visitor_id");
    if (!id) {
      id =
        "v_" +
        Math.random().toString(36).substring(2) +
        Date.now().toString(36);
      localStorage.setItem("comment_visitor_id", id);
    }
    setVisitorId(id);
  }, []);

  const activeUserId = currentUser?.id || visitorId;

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `/api/comments?targetId=${encodeURIComponent(targetId)}`,
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || t("errorLoading"));
        return;
      }
      setComments(data.comments || []);
      if (data.error) {
        setError(data.error);
      }
    } catch (err: any) {
      console.error(err);
      setError(t("errorLoading"));
    } finally {
      setLoading(false);
    }
  }, [targetId, t]);

  useEffect(() => {
    if (!targetId) return;

    let timer: ReturnType<typeof setTimeout>;

    const loadComments = () => {
      // Defer loading slightly to ensure main page rendering and video hydration complete first
      timer = setTimeout(() => {
        fetchComments();
      }, 300);
    };

    if (document.readyState === "complete") {
      loadComments();
    } else {
      window.addEventListener("load", loadComments, { once: true });
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener("load", loadComments);
    };
  }, [targetId, fetchComments]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault?.();
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetId,
          content: newComment,
          authorName: !currentUser ? authorName : undefined,
          visitorId,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || t("errorPosting"));
        return;
      }

      setComments((prev) => [data.comment, ...prev]);
      setNewComment("");
      if (!currentUser) setAuthorName("");
    } catch (err: any) {
      console.error(err);
      setError(err.message || t("errorPostingGeneral"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplySubmit = async (parentId: string) => {
    if (!replyContent.trim()) return;

    try {
      setSubmittingReply(true);
      setReplyError(null);

      const res = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetId,
          parentId,
          content: replyContent,
          authorName: !currentUser ? replyAuthorName : undefined,
          visitorId,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || t("errorReplying"));
      }

      const data = await res.json();
      setComments((prev) => [...prev, data.comment]);
      setExpandedReplies((prev) => ({ ...prev, [parentId]: true }));
      setReplyContent("");
      setReplyingToId(null);
      if (!currentUser) setReplyAuthorName("");
    } catch (err: any) {
      console.error(err);
      setReplyError(err.message || t("errorReplyingGeneral"));
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleEditSubmit = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      setSubmittingEdit(true);
      setEditError(null);

      const res = await fetch("/api/comments", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: commentId,
          content: editContent,
          visitorId,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setEditError(data.error || t("errorEditing"));
        return;
      }

      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, content: data.comment.content, isEdited: true }
            : c,
        ),
      );
      setEditingId(null);
      setEditContent("");
    } catch (err: any) {
      console.error(err);
      setEditError(err.message || t("errorEditingGeneral"));
    } finally {
      setSubmittingEdit(false);
    }
  };

  const getAllDescendantIds = useCallback(
    (parentId: string, commentList: CommentItem[]): string[] => {
      const children = commentList.filter((c) => c.parentId === parentId);
      let ids: string[] = [];
      for (const child of children) {
        ids.push(child.id);
        ids = ids.concat(getAllDescendantIds(child.id, commentList));
      }
      return ids;
    },
    [],
  );

  const handleDelete = async (commentId: string) => {
    try {
      setDeletingId(commentId);
      const query = new URLSearchParams({ id: commentId });
      if (visitorId) query.append("visitorId", visitorId);

      const res = await fetch(`/api/comments?${query.toString()}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || t("errorDeleting"));
        return;
      }

      const idsToRemove = new Set([
        commentId,
        ...getAllDescendantIds(commentId, comments),
      ]);
      setComments((prev) => prev.filter((c) => !idsToRemove.has(c.id)));
      setConfirmDeleteId(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || t("errorDeletingGeneral"));
    } finally {
      setDeletingId(null);
    }
  };

  const handleReaction = async (
    commentId: string,
    action: "like" | "dislike",
  ) => {
    if (reactingIds[commentId]) return;

    try {
      setReactingIds((prev) => ({ ...prev, [commentId]: true }));

      // Optimistic update
      setComments((prev) =>
        prev.map((c) => {
          if (c.id !== commentId) return c;

          let likedBy = [...(c.likedBy || [])];
          let dislikedBy = [...(c.dislikedBy || [])];

          const isLiked = likedBy.includes(activeUserId);
          const isDisliked = dislikedBy.includes(activeUserId);

          if (action === "like") {
            if (isLiked) {
              likedBy = likedBy.filter((id) => id !== activeUserId);
            } else {
              likedBy.push(activeUserId);
              dislikedBy = dislikedBy.filter((id) => id !== activeUserId);
            }
          } else {
            if (isDisliked) {
              dislikedBy = dislikedBy.filter((id) => id !== activeUserId);
            } else {
              dislikedBy.push(activeUserId);
              likedBy = likedBy.filter((id) => id !== activeUserId);
            }
          }

          return {
            ...c,
            likedBy,
            dislikedBy,
            likes: likedBy.length,
            dislikes: dislikedBy.length,
          };
        }),
      );

      const res = await fetch("/api/comments/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentId,
          action,
          visitorId,
        }),
      });

      if (!res.ok) {
        // Revert on error by refetching
        fetchComments();
      } else {
        const data = await res.json();
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  likes: data.likes,
                  dislikes: data.dislikes,
                  likedBy: data.likedBy,
                  dislikedBy: data.dislikedBy,
                }
              : c,
          ),
        );
      }
    } catch (err) {
      console.error(err);
      fetchComments();
    } finally {
      setReactingIds((prev) => ({ ...prev, [commentId]: false }));
    }
  };

  const formatDate = (dateInput: string | Date) => {
    try {
      const date = new Date(dateInput);
      if (isNaN(date.getTime())) return "";
      return format.dateTime(date, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  // Group comments into root comments and their replies, sorted by Top (likes & replies) or Newest
  const sortedRootComments = useMemo(() => {
    const roots = comments.filter((c) => !c.parentId);

    if (sortBy === "newest") {
      return [...roots].sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime() || 0;
        const timeB = new Date(b.createdAt).getTime() || 0;
        return timeB - timeA;
      });
    }

    // "top": sort by engagement (likes and replies count)
    return [...roots].sort((a, b) => {
      const aReplies = comments.filter((r) => r.parentId === a.id).length;
      const bReplies = comments.filter((r) => r.parentId === b.id).length;

      const aScore = (a.likes || 0) * 2 - (a.dislikes || 0) + aReplies * 3;
      const bScore = (b.likes || 0) * 2 - (b.dislikes || 0) + bReplies * 3;

      if (bScore !== aScore) {
        return bScore - aScore;
      }

      const timeA = new Date(a.createdAt).getTime() || 0;
      const timeB = new Date(b.createdAt).getTime() || 0;
      return timeB - timeA;
    });
  }, [comments, sortBy]);

  const rootComments = sortedRootComments;
  const getRepliesFor = (parentId: string) => {
    return comments.filter((c) => c.parentId === parentId);
  };

  const renderCommentCard = (comment: CommentItem, depth = 0) => {
    const isReply = depth > 0;
    const isLiked = activeUserId && comment.likedBy?.includes(activeUserId);
    const isDisliked =
      activeUserId && comment.dislikedBy?.includes(activeUserId);
    const replies = getRepliesFor(comment.id);

    const isOwner = Boolean(
      (currentUser?.id && comment.userId === currentUser.id) ||
      (!comment.userId && comment.visitorId && comment.visitorId === visitorId),
    );
    const isEditing = editingId === comment.id;

    return (
      <div key={comment.id} className="group flex flex-col gap-3">
        <div
          className={`flex gap-3.5 rounded-xl border p-4 transition-colors ${
            isReply
              ? "border-zinc-800/40 bg-[#111111]/80 hover:border-zinc-700/50"
              : "border-zinc-800/60 bg-[#0E0E0E]/60 hover:border-zinc-700/60"
          }`}
        >
          {/* User Avatar */}
          {comment.userId ? (
            <Link
              href={`/user/${comment.userUsername || comment.userId}`}
              className={`flex shrink-0 items-center justify-center rounded-full font-bold text-zinc-300 overflow-hidden border border-zinc-700/50 hover:border-blue-500 transition-colors ${
                isReply
                  ? "h-7 w-7 text-xs bg-zinc-800/80"
                  : "h-9 w-9 text-sm bg-zinc-800"
              }`}
            >
              {comment.userImage ? (
                <img
                  src={comment.userImage}
                  alt={comment.userName || "Avatar"}
                  className="h-full w-full object-cover"
                />
              ) : comment.userName ? (
                comment.userName.charAt(0).toUpperCase()
              ) : (
                <User className={isReply ? "h-3.5 w-3.5" : "h-4 w-4"} />
              )}
            </Link>
          ) : (
            <div
              className={`flex shrink-0 items-center justify-center rounded-full font-bold text-zinc-300 overflow-hidden border border-zinc-700/50 ${
                isReply
                  ? "h-7 w-7 text-xs bg-zinc-800/80"
                  : "h-9 w-9 text-sm bg-zinc-800"
              }`}
            >
              {comment.userImage ? (
                <img
                  src={comment.userImage}
                  alt={comment.userName || "Avatar"}
                  className="h-full w-full object-cover"
                />
              ) : comment.userName ? (
                comment.userName.charAt(0).toUpperCase()
              ) : (
                <User className={isReply ? "h-3.5 w-3.5" : "h-4 w-4"} />
              )}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              {comment.userId ? (
                <Link
                  href={`/user/${comment.userUsername || comment.userId}`}
                  className="text-sm font-semibold text-zinc-200 hover:text-blue-400 transition-colors truncate"
                >
                  {comment.userName}
                </Link>
              ) : (
                <span className="text-sm font-semibold text-zinc-200 truncate">
                  {comment.userName}
                </span>
              )}
              <div className="flex items-center gap-1.5 shrink-0">
                {comment.isEdited && (
                  <span className="text-[10px] text-zinc-500 italic font-normal">
                    {t("edited")}
                  </span>
                )}
                <span className="text-[11px] text-zinc-500">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
            </div>

            {isEditing ? (
              <div className="mt-2 space-y-2 mb-3">
                <textarea
                  rows={3}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full resize-none rounded-lg border border-zinc-700 bg-[#0E0E0E] p-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-blue-500 focus:outline-none"
                />
                {editError && (
                  <p className="text-[11px] text-red-400 font-medium">
                    {editError}
                  </p>
                )}
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setEditContent("");
                      setEditError(null);
                    }}
                    className="px-2.5 py-1 rounded-md text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors flex items-center gap-1"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>{t("cancel")}</span>
                  </button>
                  <button
                    type="button"
                    disabled={submittingEdit || !editContent.trim()}
                    onClick={() => handleEditSubmit(comment.id)}
                    className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-900 shadow-sm transition-all hover:bg-white active:scale-95 disabled:cursor-not-allowed disabled:bg-zinc-800/80 disabled:text-zinc-500 disabled:shadow-none"
                  >
                    {submittingEdit ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    <span>{t("save")}</span>
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-zinc-300 whitespace-pre-wrap break-words leading-relaxed mb-3">
                {comment.content}
              </p>
            )}

            {/* Action Bar (Like, Dislike, Reply, Edit, Delete) */}
            <div className="flex items-center gap-4 text-xs">
              {/* Like */}
              <button
                type="button"
                onClick={() => handleReaction(comment.id, "like")}
                disabled={reactingIds[comment.id]}
                className={`flex items-center gap-1.5 p-2 rounded-full transition-colors ${
                  isLiked
                    ? "text-blue-400 bg-blue-500/10 font-medium"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                }`}
                title={t("like")}
              >
                <ThumbsUp
                  className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`}
                />
                <span>{comment.likes > 0 ? comment.likes : ""}</span>
              </button>

              {/* Dislike */}
              <button
                type="button"
                onClick={() => handleReaction(comment.id, "dislike")}
                disabled={reactingIds[comment.id]}
                className={`flex items-center gap-1.5 p-2 rounded-full transition-colors ${
                  isDisliked
                    ? "text-rose-400 bg-rose-500/10 font-medium"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                }`}
                title={t("dislike")}
              >
                <ThumbsDown
                  className={`h-4 w-4 ${isDisliked ? "fill-current" : ""}`}
                />
                <span>{comment.dislikes > 0 ? comment.dislikes : ""}</span>
              </button>

              {/* Reply Button */}
              <button
                type="button"
                onClick={() => {
                  if (replyingToId === comment.id) {
                    setReplyingToId(null);
                  } else {
                    setReplyingToId(comment.id);
                    setReplyError(null);
                  }
                }}
                className="flex items-center gap-1.5 p-2 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors font-medium"
              >
                <Reply className="h-4 w-4" />
                <span>{t("reply")}</span>
              </button>

              {/* Owner actions: Edit & Delete */}
              {isOwner && !isEditing && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(comment.id);
                      setEditContent(comment.content);
                      setEditError(null);
                    }}
                    className="flex items-center gap-1.5 p-2 rounded-full text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors font-medium"
                    title={t("edit")}
                  >
                    <Pencil className="h-4 w-4" />
                    <span>{t("edit")}</span>
                  </button>

                  {confirmDeleteId === comment.id ? (
                    <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 p-2 rounded-full">
                      <span className="text-[11px] text-red-400 font-medium">
                        {t("deleteConfirm")}
                      </span>
                      <button
                        type="button"
                        disabled={deletingId === comment.id}
                        onClick={() => handleDelete(comment.id)}
                        className="text-xs font-bold text-red-400 hover:text-red-300 underline disabled:opacity-50"
                      >
                        {deletingId === comment.id ? (
                          <Loader2 className="h-3 w-3 animate-spin inline" />
                        ) : (
                          t("yes")
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-xs text-zinc-400 hover:text-zinc-200"
                      >
                        {t("no")}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(comment.id)}
                      className="flex items-center gap-1.5 p-2 rounded-full text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors font-medium"
                      title={t("delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>{t("delete")}</span>
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Inline Reply Form */}
            {replyingToId === comment.id && (
              <div className="mt-3.5 pt-3 border-t border-zinc-800/80 space-y-2">
                <span className="text-xs font-medium text-zinc-400 flex items-center gap-1.5 mb-1">
                  <Reply className="h-3.5 w-3.5 text-zinc-400" />
                  <span>{t("replyingTo", { userName: comment.userName })}</span>
                </span>

                <CommentForm
                  isReply
                  value={replyContent}
                  onChange={setReplyContent}
                  onSubmit={() => handleReplySubmit(comment.id)}
                  placeholder={t("replyPlaceholder", {
                    userName: comment.userName,
                  })}
                  submitting={submittingReply}
                  submitText={t("reply")}
                  onCancel={() => setReplyingToId(null)}
                  cancelText={t("cancel")}
                  error={replyError}
                  currentUser={currentUser}
                  authorName={replyAuthorName}
                  onAuthorNameChange={setReplyAuthorName}
                  authorPlaceholder={t("replyAuthorPlaceholder")}
                />
              </div>
            )}
          </div>
        </div>

        {/* Toggle & Nested Replies */}
        {replies.length > 0 && (
          <div className="flex flex-col gap-2">
            <div
              className={
                depth === 0
                  ? "ml-4 sm:ml-8"
                  : depth === 1
                    ? "ml-3 sm:ml-6"
                    : "ml-2 sm:ml-4"
              }
            >
              <button
                type="button"
                onClick={() => toggleExpandReplies(comment.id)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:bg-[#2A2A2A] transition-colors p-2 rounded-full"
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    expandedReplies[comment.id] ? "rotate-180" : ""
                  }`}
                />
                <span>
                  {expandedReplies[comment.id]
                    ? t("hideReplies")
                    : t("showReplies")}{" "}
                  {t("replyCount", { count: replies.length })}
                </span>
              </button>
            </div>

            {expandedReplies[comment.id] && (
              <div
                className={
                  depth === 0
                    ? "ml-4 sm:ml-8 pl-3 border-l-2 border-zinc-800/80 space-y-3"
                    : depth === 1
                      ? "ml-3 sm:ml-6 pl-2.5 border-l-2 border-zinc-800/60 space-y-3"
                      : "ml-2 sm:ml-4 pl-2 border-l border-zinc-800/40 space-y-3"
                }
              >
                {replies.map((reply) => renderCommentCard(reply, depth + 1))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="mt-8 p-5 lg:p-6">
      {/* Header */}
      <div className="flex items-center gap-8 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          {!loading && (
            <span className="text-base lg:text-xl font-medium lg:font-bold text-white">
              {t("title", { count: comments.length })}
            </span>
          )}
        </div>

        {/* Filter / Sort comments */}
        {!loading && comments.length > 0 && (
          <div ref={sortRef} className="relative">
            <button
              type="button"
              onClick={() => setIsSortOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800/70 transition-colors"
              title="Filtrar comentários"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 12H3" />
                <path d="M3 5h18" />
                <path d="M9 19H3" />
              </svg>
              <span>{sortBy === "top" ? sortTopLabel : sortNewestLabel}</span>
            </button>

            {isSortOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-30 min-w-[150px] rounded-xl  bg-[#121212]/95 backdrop-blur-md py-2">
                <button
                  type="button"
                  onClick={() => {
                    setSortBy("top");
                    setIsSortOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors text-left ${
                    sortBy === "top"
                      ? "bg-zinc-800 text-white font-semibold"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 font-medium"
                  }`}
                >
                  <span>{sortTopLabel}</span>
                  {sortBy === "top" && (
                    <Check className="h-3.5 w-3.5 text-zinc-100" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSortBy("newest");
                    setIsSortOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors text-left ${
                    sortBy === "newest"
                      ? "bg-zinc-800 text-white font-semibold"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 font-medium"
                  }`}
                >
                  <span>{sortNewestLabel}</span>
                  {sortBy === "newest" && (
                    <Check className="h-3.5 w-3.5 text-zinc-100" />
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Comment Form */}
      <div className="mb-8">
        <CommentForm
          value={newComment}
          onChange={setNewComment}
          onSubmit={handleSubmit}
          placeholder={t("inputPlaceholder")}
          submitting={submitting}
          submitText={t("submit")}
          error={error}
          currentUser={currentUser}
          authorName={authorName}
          onAuthorNameChange={setAuthorName}
          authorLabel={t("authorNameLabel")}
          authorPlaceholder={t("authorNamePlaceholder")}
        />
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex gap-3.5 rounded-xl border border-zinc-800/60 bg-[#0E0E0E]/60 p-4"
              >
                <div className="h-9 w-9 shrink-0 rounded-full bg-zinc-800" />
                <div className="flex-1 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-28 rounded bg-zinc-800" />
                    <div className="h-3 w-16 rounded bg-zinc-800/60" />
                  </div>
                  <div className="h-4 w-3/4 rounded bg-zinc-800/80" />
                  <div className="h-4 w-1/2 rounded bg-zinc-800/50" />
                  <div className="flex gap-3 pt-1">
                    <div className="h-4 w-10 rounded bg-zinc-800/40" />
                    <div className="h-4 w-10 rounded bg-zinc-800/40" />
                    <div className="h-4 w-14 rounded bg-zinc-800/40" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-zinc-500">
            <p className="text-sm">{t("empty")}</p>
          </div>
        ) : (
          rootComments.map((comment) => renderCommentCard(comment))
        )}
      </div>
    </section>
  );
}
