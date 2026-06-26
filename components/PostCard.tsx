import Link from "next/link";
import Image from "next/image";
import type { BlogPost } from "@/lib/blogger";

interface PostCardProps {
  post: BlogPost;
}

export function PostCard({ post }: PostCardProps) {
  const date = new Date(post.published).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const isPinned = post.labels.some((l) => {
    const lower = l.toLowerCase();
    return lower === "pin" || lower.startsWith("pin:");
  });

  const displayLabels = post.labels.filter((l) => {
    const lower = l.toLowerCase();
    return lower !== "pin" && !lower.startsWith("pin:");
  });

  return (
    <Link href={`/posts/${post.slug}`} className="post-card" id={`post-${post.slug}`}>
      {post.thumbnail && (
        <div className="post-card-thumbnail">
          <Image
            src={post.thumbnail}
            alt={post.title}
            width={160}
            height={120}
            className="post-card-image"
            unoptimized
          />
        </div>
      )}
      <div className="post-card-body">
        <h3 className="post-card-title">{post.title}</h3>
        <p className="post-card-excerpt">{post.excerpt}</p>
        <div className="post-card-meta">
          <span className="post-card-date">{date}</span>
          <span className="post-card-dot">·</span>
          <span className="post-card-reading-time">
            {post.readingTime} min read
          </span>
          {isPinned && (
            <>
              <span className="post-card-dot">·</span>
              <span className="post-card-pinned-badge">📌 Pinned</span>
            </>
          )}
          {displayLabels.length > 0 && (
            <>
              <span className="post-card-dot">·</span>
              <div className="post-card-labels">
                {displayLabels.slice(0, 3).map((label) => (
                  <span key={label} className="post-card-label">
                    {label}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
