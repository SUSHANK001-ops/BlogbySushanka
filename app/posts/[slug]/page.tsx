import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { fetchPostBySlug, fetchAllPosts } from "@/lib/blogger";
import { PostContent } from "@/components/PostContent";
import { CommentSection } from "@/components/CommentSection";
import { TableOfContents } from "@/components/TableOfContents";
import { AdPlaceholder } from "@/components/AdPlaceholder";
import { ShareButtons } from "@/components/ShareButtons";

export const revalidate = 60;

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.published,
      ...(post.thumbnail && { images: [{ url: post.thumbnail }] }),
    },
  };
}

export async function generateStaticParams() {
  const posts = await fetchAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const date = new Date(post.published).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="post-page">
      <div className="post-layout">
        {/* Main Content — Left Column */}
        <div className="post-main">
          {/* Breadcrumb */}
          {post.labels.length > 0 && (
            <nav className="post-breadcrumb" aria-label="Breadcrumb">
              <Link href="/" className="breadcrumb-link">
                Home
              </Link>
              <span className="breadcrumb-separator">/</span>
              <Link
                href={`/label/${encodeURIComponent(post.labels[0])}`}
                className="breadcrumb-link"
              >
                {post.labels[0]}
              </Link>
            </nav>
          )}

          {/* Title */}
          <h1 className="post-title">{post.title}</h1>


          {/* Author & Meta */}
          <div className="post-meta-bar">
            <div className="post-author-info">
              {post.author.image?.url && (
                <img
                  src={post.author.image.url}
                  alt={post.author.displayName}
                  className="post-author-avatar"
                />
              )}
              <div>
                <p className="post-author-name">{post.author.displayName}</p>
                <p className="post-meta-date">
                  {date} · {post.readingTime} min read
                </p>
              </div>
            </div>

            {/* Labels */}
            <div className="post-labels">
              {post.labels.map((label) => (
                <Link
                  key={label}
                  href={`/label/${encodeURIComponent(label)}`}
                  className="post-label-tag"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Post Content */}
          <PostContent html={post.content} />

          {/* Author Bio Card */}
          <div className="author-card">
            {post.author.image?.url && (
              <img
                src={post.author.image.url}
                alt={post.author.displayName}
                className="author-card-avatar"
              />
            )}
            <div>
              <p className="author-card-name">{post.author.displayName}</p>
              <p className="author-card-bio">
                Writer and creator. Sharing thoughts, ideas, and stories.
              </p>
            </div>
          </div>

          {/* Share Buttons */}
          <ShareButtons title={post.title} />

          {/* Comments */}
          <CommentSection postSlug={slug} />
        </div>

        {/* Sidebar — Right Column */}
        <aside className="post-sidebar">
          <div className="post-sidebar-sticky">
            {/* <AdPlaceholder /> */}
            <TableOfContents html={post.content} />
          </div>
        </aside>
      </div>
    </article>
  );
}
