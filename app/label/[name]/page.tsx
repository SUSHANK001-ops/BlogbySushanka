import { Metadata } from "next";
import Link from "next/link";
import { fetchPostsByLabel, fetchAllLabels } from "@/lib/blogger";
import { PostCard } from "@/components/PostCard";

export const revalidate = 60;

interface LabelPageProps {
  params: Promise<{ name: string }>;
}

export async function generateMetadata({
  params,
}: LabelPageProps): Promise<Metadata> {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  return {
    title: `${decodedName} Posts`,
    description: `Browse all blog posts tagged with "${decodedName}".`,
  };
}

export async function generateStaticParams() {
  const labels = await fetchAllLabels();
  return labels.map((label) => ({ name: encodeURIComponent(label) }));
}

export default async function LabelPage({ params }: LabelPageProps) {
  const { name } = await params;
  const decodedName = decodeURIComponent(name);
  const posts = await fetchPostsByLabel(decodedName);

  return (
    <div className="label-page">
      <div className="label-page-header">
        <Link href="/" className="label-back-link">
          ← All Posts
        </Link>
        <h1 className="label-page-title">
          <span className="label-page-tag">#</span>
          {decodedName}
        </h1>
        <p className="label-page-count">
          {posts.length} post{posts.length !== 1 ? "s" : ""}
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="blog-list-empty">
          <p>No posts found with this label.</p>
        </div>
      ) : (
        <div className="blog-list-posts">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
