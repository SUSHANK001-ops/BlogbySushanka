"use client";

import { LikeButton } from "@/components/LikeButton";

interface CommentUser {
  id: string;
  name: string;
  image: string | null;
  provider: string;
}

export interface CommentNode {
  id: string;
  content: string;
  createdAt: string;
  user: CommentUser;
  _count: { likes: number };
  replies?: CommentNode[];
}

interface CommentItemProps {
  comment: CommentNode;
  postSlug: string;
  isLiked: boolean;
  likeCount: number;
  currentUserId: string | null;
  userCommentLikes: string[];
  commentLikeCounts: Record<string, number>;
  onReply?: (comment: CommentNode) => void;
  onDelete?: (commentId: string) => void;
}

function getInitial(name: string): string {
  return name.charAt(0).toUpperCase();
}

function relativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffWeek < 4) return `${diffWeek}w ago`;
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  return date.toLocaleDateString();
}

export function CommentItem({
  comment,
  postSlug,
  isLiked,
  likeCount,
  currentUserId,
  userCommentLikes,
  commentLikeCounts,
  onReply,
  onDelete,
}: CommentItemProps) {
  const isAnonymous = comment.user.provider === "anonymous";
  const canReply = !!currentUserId && !isAnonymous;
  const canDelete = !!currentUserId && comment.user.id === currentUserId && !isAnonymous;

  return (
    <div className="comment-thread" id={`comment-${comment.id}`}>
      <div className="comment-item">
        <div className="comment-avatar">
          {comment.user.image ? (
            <img
              src={comment.user.image}
              alt={comment.user.name}
              className="comment-avatar-img"
            />
          ) : (
            <div className="comment-avatar-fallback">
              {getInitial(comment.user.name)}
            </div>
          )}
        </div>
        <div className="comment-body">
          <div className="comment-header">
            <span className="comment-author">
              {comment.user.name}
              {isAnonymous && (
                <span className="comment-anon-badge">Guest</span>
              )}
            </span>
            <span className="comment-date">
              {relativeTime(comment.createdAt)}
            </span>
          </div>
          <p className="comment-text">{comment.content}</p>
          <div className="comment-actions">
            <LikeButton
              type="comment"
              postSlug={postSlug}
              commentId={comment.id}
              initialCount={likeCount}
              initialLiked={isLiked}
            />
            {canReply && onReply && (
              <button
                type="button"
                className="comment-action-btn"
                onClick={() => onReply(comment)}
              >
                Reply
              </button>
            )}
            {canDelete && onDelete && (
              <button
                type="button"
                className="comment-action-btn comment-delete-btn"
                onClick={() => onDelete(comment.id)}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {comment.replies?.length ? (
        <div className="comment-replies">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postSlug={postSlug}
              isLiked={userCommentLikes.includes(reply.id)}
              likeCount={commentLikeCounts[reply.id] ?? reply._count.likes}
              currentUserId={currentUserId}
              userCommentLikes={userCommentLikes}
              commentLikeCounts={commentLikeCounts}
              onReply={onReply}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
