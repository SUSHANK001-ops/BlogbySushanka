"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { CommentItem, CommentNode } from "@/components/CommentItem";
import { LikeButton } from "@/components/LikeButton";

interface CommentUser {
  id: string;
  name: string;
  image: string | null;
  provider: string;
}

interface Comment extends CommentNode {
  postSlug?: string;
  parentCommentId?: string | null;
  replies?: Comment[];
}

interface LikesData {
  postLikeCount: number;
  commentLikeCounts: Record<string, number>;
  userPostLiked: boolean;
  userCommentLikes: string[];
}

interface CommentSectionProps {
  postSlug: string;
}

export function CommentSection({ postSlug }: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [likesData, setLikesData] = useState<LikesData>({
    postLikeCount: 0,
    commentLikeCounts: {},
    userPostLiked: false,
    userCommentLikes: [],
  });
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?slug=${encodeURIComponent(postSlug)}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    }
  }, [postSlug]);

  const fetchLikes = useCallback(async () => {
    try {
      const res = await fetch(`/api/likes?slug=${encodeURIComponent(postSlug)}`);
      if (res.ok) {
        const data = await res.json();
        setLikesData(data);
      }
    } catch (error) {
      console.error("Failed to fetch likes:", error);
    }
  }, [postSlug]);

  useEffect(() => {
    Promise.all([fetchComments(), fetchLikes()]).finally(() =>
      setIsLoading(false)
    );
  }, [fetchComments, fetchLikes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postSlug, content: content.trim() }),
      });

      if (res.ok) {
        const newComment = await res.json();
        setComments((prev) => [newComment, ...prev]);
        setContent("");
      }
    } catch (error) {
      console.error("Failed to post comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyTo || !replyContent.trim() || isReplying) return;

    if (!session?.user?.id || replyTo.user.provider === "anonymous") {
      return;
    }

    setIsReplying(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postSlug,
          content: replyContent.trim(),
          parentCommentId: replyTo.id,
        }),
      });

      if (res.ok) {
        const newReply = await res.json();

        const insertReply = (items: Comment[]): Comment[] =>
          items.map((comment) => {
            if (comment.id === replyTo.id) {
              return {
                ...comment,
                replies: [...(comment.replies ?? []), newReply],
              };
            }

            return {
              ...comment,
              replies: comment.replies?.length ? insertReply(comment.replies) : [],
            };
          });

        setComments((prev) =>
          insertReply(prev)
        );
        setReplyTo(null);
        setReplyContent("");
      }
    } catch (error) {
      console.error("Failed to post reply:", error);
    } finally {
      setIsReplying(false);
    }
  };

  const requestDeleteComment = (commentId: string) => {
    setDeleteConfirmId(commentId);
  };

  const executeDelete = async (commentId: string) => {
    setDeleteConfirmId(null);
    try {
      const res = await fetch("/api/comments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      });

      if (res.ok) {
        const removeComment = (items: Comment[]): Comment[] =>
          items
            .filter((comment) => comment.id !== commentId)
            .map((comment) => ({
              ...comment,
              replies: comment.replies?.length ? removeComment(comment.replies) : [],
            }));

        setComments((prev) => removeComment(prev));
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="comment-section">
        <div className="comment-section-skeleton">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-text" />
          <div className="skeleton skeleton-text" />
        </div>
      </div>
    );
  }

  return (
    <div className="comment-section" id="comments">
      {/* Post Like */}
      <div className="comment-section-header">
        <h3 className="comment-section-title">
          Comments ({comments.length})
        </h3>
        <LikeButton
          type="post"
          postSlug={postSlug}
          initialCount={likesData.postLikeCount}
          initialLiked={likesData.userPostLiked}
        />
      </div>

      {/* Comment Input */}
      <form onSubmit={handleSubmit} className="comment-form">
        <div className="comment-form-header">
          {session?.user ? (
            <div className="comment-form-user">
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name ?? "User"}
                  className="comment-form-avatar"
                />
              )}
              <span className="comment-form-name">{session.user.name}</span>
            </div>
          ) : (
            <div className="comment-form-user">
              <div className="comment-form-avatar-anon">?</div>
              <span className="comment-form-name comment-form-name-anon">
                Commenting as guest
              </span>
            </div>
          )}
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write a comment..."
          className="comment-input"
          rows={3}
          id="comment-input"
        />
        <div className="comment-form-footer">
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="comment-submit"
            id="comment-submit"
          >
            {isSubmitting ? (
              <span className="comment-submit-loading">
                <svg className="spinner" width="16" height="16" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 70" />
                </svg>
                Posting...
              </span>
            ) : (
              "Post Comment"
            )}
          </button>
        </div>
      </form>

      

      {/* Comment List */}
      <div className="comment-list">
        {comments.length === 0 ? (
          <p className="comment-empty">
            No comments yet. Be the first to share your thoughts!
          </p>
        ) : (
          comments.map((comment) => (
            <> 
              <CommentItem
                comment={comment}
                postSlug={postSlug}
                isLiked={likesData.userCommentLikes.includes(comment.id)}
                likeCount={likesData.commentLikeCounts[comment.id] ?? 0}
                currentUserId={session?.user?.id ?? null}
                userCommentLikes={likesData.userCommentLikes}
                commentLikeCounts={likesData.commentLikeCounts}
                onReply={
                  session?.user?.id && comment.user.provider !== "anonymous"
                    ? () => setReplyTo(comment)
                    : undefined
                }
                onDelete={
                  session?.user?.id
                    ? requestDeleteComment
                    : undefined
                }
              />
              {replyTo?.id === comment.id && (
                <form onSubmit={handleReplySubmit} className="comment-form comment-reply-form">
                  <div className="comment-form-header">
                    <div className="comment-form-user">
                      <span className="comment-form-name">Replying to {replyTo.user.name}</span>
                    </div>
                  </div>
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Reply to ${replyTo.user.name}...`}
                    className="comment-input"
                    rows={3}
                  />
                  <div className="comment-form-footer comment-reply-footer">
                    <button
                      type="button"
                      className="comment-cancel"
                      onClick={() => {
                        setReplyTo(null);
                        setReplyContent("");
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!replyContent.trim() || isReplying}
                      className="comment-submit"
                    >
                      {isReplying ? "Replying..." : "Post Reply"}
                    </button>
                  </div>
                </form>
              )}
            </>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal">
            <h3 className="confirm-modal-title">Delete Comment</h3>
            <p className="confirm-modal-text">
              Are you sure you want to delete this comment? This action cannot be undone.
            </p>
            <div className="confirm-modal-actions">
              <button
                type="button"
                className="confirm-cancel-btn"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="confirm-delete-btn"
                onClick={() => executeDelete(deleteConfirmId)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
