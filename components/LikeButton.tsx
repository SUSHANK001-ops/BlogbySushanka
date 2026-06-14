"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { AuthModal } from "@/components/AuthModal";

interface LikeButtonProps {
  type: "post" | "comment";
  postSlug: string;
  commentId?: string;
  initialCount: number;
  initialLiked: boolean;
}

export function LikeButton({
  type,
  postSlug,
  commentId,
  initialCount,
  initialLiked,
}: LikeButtonProps) {
  const { status } = useSession();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = useCallback(async () => {
    if (status !== "authenticated") {
      setShowAuthModal(true);
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    // Optimistic update
    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);

    try {
      const endpoint =
        type === "post" ? "/api/likes/post" : "/api/likes/comment";
      const body =
        type === "post"
          ? { postSlug }
          : { postSlug, commentId };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        // Revert optimistic update
        setLiked(liked);
        setCount(count);
      }
    } catch {
      // Revert on error
      setLiked(liked);
      setCount(count);
    } finally {
      setIsLoading(false);
    }
  }, [status, liked, count, isLoading, type, postSlug, commentId]);

  return (
    <>
      <button
        onClick={handleClick}
        className={`like-button ${liked ? "liked" : ""}`}
        disabled={isLoading}
        aria-label={liked ? "Unlike" : "Like"}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill={liked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="like-icon"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        {count > 0 && <span className="like-count">{count}</span>}
      </button>
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
}
