import { fetchAllPosts } from "@/lib/blogger";
import { BlogListClient } from "./BlogListClient";

export const revalidate = 60;

export default async function HomePage() {
  const posts = await fetchAllPosts();

  return <BlogListClient posts={posts} />;
}
